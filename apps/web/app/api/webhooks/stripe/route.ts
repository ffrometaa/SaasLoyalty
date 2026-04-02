import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@loyalty-os/lib';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  // Check idempotency
  const { data: existingEvent } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (existingEvent) {
    console.log('Event already processed:', event.id);
    return NextResponse.json({ received: true, status: 'already_processed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(supabase, subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabase, invoice);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    // Mark event as processed
    await supabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  // Get tenant metadata from session
  const tenantSlug = session.metadata?.tenant_slug;
  const businessName = session.metadata?.business_name;
  const businessType = session.metadata?.business_type;
  const plan = session.metadata?.plan || 'starter';

  if (!tenantSlug) {
    console.error('Missing tenant_slug in session metadata');
    return;
  }

  // Update tenant with Stripe customer info
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  await supabase
    .from('tenants')
    .update({
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan: plan,
      plan_status: 'active',
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .eq('slug', tenantSlug);

  console.log('Tenant updated from checkout:', tenantSlug);
}

async function handleSubscriptionCreated(supabase: any, subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);

  const customerId = subscription.customer as string;
  const plan = subscription.metadata?.plan || 'starter';

  await supabase
    .from('tenants')
    .update({
      stripe_subscription_id: subscription.id,
      plan: plan,
      plan_status: 'active',
    })
    .eq('stripe_customer_id', customerId);
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  const customerId = subscription.customer as string;
  const plan = subscription.metadata?.plan || 'starter';

  let planStatus = 'active';
  if (subscription.status === 'past_due') {
    planStatus = 'past_due';
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    planStatus = 'canceled';
  }

  await supabase
    .from('tenants')
    .update({
      plan,
      plan_status: planStatus,
    })
    .eq('stripe_customer_id', customerId);
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const customerId = subscription.customer as string;

  await supabase
    .from('tenants')
    .update({
      plan_status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', customerId);
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);

  const customerId = invoice.customer as string;

  await supabase
    .from('tenants')
    .update({ plan_status: 'past_due' })
    .eq('stripe_customer_id', customerId);

  // TODO: Send email notification to tenant
  console.log('Tenant marked as past_due:', customerId);
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);

  const customerId = invoice.customer as string;

  await supabase
    .from('tenants')
    .update({ plan_status: 'active' })
    .eq('stripe_customer_id', customerId);
}
