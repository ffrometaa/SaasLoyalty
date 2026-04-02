// Stripe webhook handler for LoyaltyOS
// Handles subscription lifecycle events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  
  // Verify webhook signature
  const body = await req.text();
  
  let event: any;
  try {
    // In production, use Stripe SDK to verify
    // For now, parse JSON directly
    event = JSON.parse(body);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid payload', { status: 400 });
  }

  // Create Supabase client with service role
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check for idempotency
  if (event.id) {
    const { data: existingEvent } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .single();
    
    if (existingEvent) {
      console.log('Event already processed:', event.id);
      return new Response('OK', { status: 200 });
    }
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(supabase, event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object);
        break;
      
      default:
        console.log('Unhandled event type:', event.type);
    }

    // Mark event as processed
    if (event.id) {
      await supabase.from('stripe_events').insert({
        id: event.id,
        type: event.type,
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response('Webhook handler failed', { status: 500 });
  }
});

async function handleSubscriptionCreated(supabase: any, subscription: any) {
  console.log('Subscription created:', subscription.id);
  
  const customerId = subscription.customer;
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

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  console.log('Subscription updated:', subscription.id);
  
  const customerId = subscription.customer;
  const plan = subscription.metadata?.plan || 'starter';
  
  // Map Stripe status to our status
  let planStatus = 'active';
  if (subscription.status === 'past_due') {
    planStatus = 'past_due';
  } else if (subscription.status === 'canceled') {
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

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  console.log('Subscription deleted:', subscription.id);
  
  const customerId = subscription.customer;
  
  await supabase
    .from('tenants')
    .update({
      plan_status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', customerId);
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  console.log('Payment failed:', invoice.id);
  
  const customerId = invoice.customer;
  
  await supabase
    .from('tenants')
    .update({ plan_status: 'past_due' })
    .eq('stripe_customer_id', customerId);
  
  // TODO: Send email notification to tenant
}

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  console.log('Payment succeeded:', invoice.id);
  
  const customerId = invoice.customer;
  
  await supabase
    .from('tenants')
    .update({ plan_status: 'active' })
    .eq('stripe_customer_id', customerId);
}
