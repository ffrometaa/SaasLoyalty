import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { buildBilingualEmail, buildWelcomeTenantEmail, buildPaymentFailedEmail } from '@loyalty-os/email';

// Guaranteed set at server startup — app fails to initialize without these keys
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Guaranteed set at server startup — webhook verification is skipped entirely without this
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

export async function POST(request: NextRequest): Promise<NextResponse> {
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
  } catch (err: unknown) {
    console.error('Webhook signature verification failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Service role required: webhook updates any tenant by stripe_customer_id, bypassing RLS by design
  const supabase = createServiceRoleClient();

  // Check idempotency
  const { data: existingEvent, error: idempotencyError } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (idempotencyError && idempotencyError.code !== 'PGRST116') {
    // PGRST116 = no rows found (expected when event is new); any other error is unexpected
    console.error('Idempotency check failed:', idempotencyError);
  }

  if (existingEvent) {
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
        // Unhandled event types are intentionally ignored
        break;
    }

    // Mark event as processed
    const { error: insertError } = await supabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
    });
    if (insertError) console.error('Failed to record stripe event:', insertError);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(supabase: SupabaseClient, session: Stripe.Checkout.Session): Promise<void> {
  const tenantSlug = session.metadata?.tenant_slug;
  const businessName = session.metadata?.business_name;
  const businessType = session.metadata?.business_type;
  const plan = session.metadata?.plan || 'starter';
  const customerEmail = session.customer_email || session.customer_details?.email || '';

  if (!tenantSlug) {
    console.error('Missing tenant_slug in session metadata');
    return;
  }

  // Update tenant with Stripe customer info.
  // Do NOT override trial_ends_at — it was set correctly during registration
  // (14 days standard, 60 days for founding partners).
  const { error: tenantUpdateError } = await supabase
    .from('tenants')
    .update({
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan: plan,
      plan_status: 'trialing',
    })
    .eq('slug', tenantSlug);

  if (tenantUpdateError) throw new Error(`Failed to update tenant ${tenantSlug}: ${tenantUpdateError.message}`);

  // Check if this customer had a previous demo request (attribution)
  let cameFromDemo = false;
  let demoRequestedAt: string | null = null;

  if (customerEmail) {
    const { data: demoRequest, error: demoError } = await supabase
      .from('demo_requests')
      .select('id, created_at')
      .eq('email', customerEmail.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (demoError && demoError.code !== 'PGRST116') {
      console.error('Failed to query demo_requests:', demoError);
    }

    if (demoRequest) {
      cameFromDemo = true;
      demoRequestedAt = demoRequest.created_at;

      const { error: demoUpdateError } = await supabase
        .from('demo_requests')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          converted_tenant_slug: tenantSlug,
        })
        .eq('id', demoRequest.id);

      if (demoUpdateError) console.error('Failed to update demo_request attribution:', demoUpdateError);
    }
  }

  // Notify owner of new customer
  await notifyNewCustomer({
    businessName: businessName || tenantSlug,
    businessType: businessType || '',
    email: customerEmail,
    plan,
    tenantSlug,
    cameFromDemo,
    demoRequestedAt,
  });

  // Send welcome email to the new customer
  if (customerEmail) {
    await sendWelcomeEmail({
      businessName: businessName || tenantSlug,
      email: customerEmail,
      plan,
    });
  }
}

async function notifyNewCustomer({
  businessName,
  businessType,
  email,
  plan,
  tenantSlug,
  cameFromDemo,
  demoRequestedAt,
}: {
  businessName: string;
  businessType: string;
  email: string;
  plan: string;
  tenantSlug: string;
  cameFromDemo: boolean;
  demoRequestedAt: string | null;
}): Promise<void> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set — skipping owner notification');
    return;
  }

  const planNames: Record<string, string> = {
    starter: 'Starter ($199/mo)',
    pro: 'Pro ($399/mo)',
    scale: 'Scale ($599/mo)',
  };

  const planLabel = planNames[plan] || plan;
  const attributionBadge = cameFromDemo
    ? `<span style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #10b981; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">✓ Viene de demo</span>`
    : `<span style="background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.4); color: #a78bfa; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">Orgánico</span>`;

  const demoNote = cameFromDemo && demoRequestedAt
    ? `<tr style="border-top: 1px solid rgba(255,255,255,0.07);">
        <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px; width: 140px;">Demo solicitado</td>
        <td style="padding: 10px 0; font-size: 13px;">${new Date(demoRequestedAt).toLocaleDateString('es-AR', { dateStyle: 'long' })}</td>
      </tr>`
    : '';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'LoyaltyOS <leads@loyalbase.dev>',
      to: ['felixdfrometa@gmail.com'],
      subject: `🎉 Nuevo cliente: ${businessName} — ${planLabel}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #059669, #2563eb); padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🎉 ¡Nuevo cliente en LoyaltyOS!</h1>
            <p style="margin: 6px 0 0; opacity: 0.85; font-size: 14px;">Trial de 14 días activado</p>
          </div>

          <div style="padding: 32px;">
            <div style="margin-bottom: 20px;">${attributionBadge}</div>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px; width: 140px;">Negocio</td>
                <td style="padding: 10px 0; font-weight: 700; font-size: 15px;">${businessName}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Tipo</td>
                <td style="padding: 10px 0;">${businessType}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Email</td>
                <td style="padding: 10px 0;">
                  <a href="mailto:${email}" style="color: #a78bfa; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Plan</td>
                <td style="padding: 10px 0; font-weight: 600; color: #34d399;">${planLabel}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Dashboard</td>
                <td style="padding: 10px 0; font-size: 13px;"><a href="https://dashboard.loyalbase.dev" style="color: #a78bfa; text-decoration: none;">dashboard.loyalbase.dev</a></td>
              </tr>
              ${demoNote}
            </table>

            <div style="margin-top: 28px; padding: 16px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25); border-radius: 8px; font-size: 13px; color: rgba(255,255,255,0.7);">
              💡 Contactalos en los próximos días para asegurarte de que el onboarding salga bien — los clientes que reciben ayuda en la primera semana tienen 3x más retención.
            </div>
          </div>
        </div>
      `,
    }),
  });
}

async function sendWelcomeEmail({
  businessName,
  email,
  plan,
}: {
  businessName: string;
  email: string;
  plan: string;
}): Promise<void> {
  // From address should match tenant custom domain when available for better deliverability.
  // Default: LoyaltyOS <hello@loyalbase.dev>
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  const { enSubject, esSubject, enHtmlContent, esHtmlContent } = buildWelcomeTenantEmail({
    businessName,
    plan,
    dashboardUrl: 'https://dashboard.loyalbase.dev',
  });

  const { subject, html } = buildBilingualEmail({
    enSubject,
    esSubject,
    enHtmlContent,
    esHtmlContent,
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'LoyaltyOS <hello@loyalbase.dev>',
      to: [email],
      subject,
      html,
    }),
  });
}

async function handleSubscriptionCreated(supabase: SupabaseClient, subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;
  const plan = subscription.metadata?.plan || 'starter';

  const { error } = await supabase
    .from('tenants')
    .update({
      stripe_subscription_id: subscription.id,
      plan: plan,
      plan_status: 'active',
    })
    .eq('stripe_customer_id', customerId);

  if (error) throw new Error(`handleSubscriptionCreated: failed to update tenant: ${error.message}`);
}

async function handleSubscriptionUpdated(supabase: SupabaseClient, subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;
  const newPlan = subscription.metadata?.plan || 'starter';

  let planStatus = 'active';
  if (subscription.status === 'past_due') {
    planStatus = 'past_due';
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    planStatus = 'canceled';
  }

  // Fetch previous plan before updating to detect Scale upgrades
  const { data: existing, error: fetchError } = await supabase
    .from('tenants')
    .select('plan, business_name, owner_email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (fetchError) throw new Error(`handleSubscriptionUpdated: failed to fetch tenant: ${fetchError.message}`);

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ plan: newPlan, plan_status: planStatus })
    .eq('stripe_customer_id', customerId);

  if (updateError) throw new Error(`handleSubscriptionUpdated: failed to update tenant: ${updateError.message}`);

  // Send Account Manager assignment email when tenant upgrades to Scale
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const AM_EMAIL = process.env.ACCOUNT_MANAGER_EMAIL || 'am@loyalbase.dev';
  if (
    RESEND_API_KEY &&
    newPlan === 'scale' &&
    existing?.plan !== 'scale' &&
    existing?.owner_email
  ) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LoyaltyOS <noreply@loyalbase.dev>',
        to: AM_EMAIL,
        subject: `New Scale customer: ${existing.business_name}`,
        html: `<p>A tenant just upgraded to <strong>Scale</strong>.</p>
<ul>
  <li><strong>Business:</strong> ${existing.business_name}</li>
  <li><strong>Email:</strong> ${existing.owner_email}</li>
  <li><strong>Previous plan:</strong> ${existing.plan}</li>
</ul>
<p>Reach out within 24 hours to introduce yourself as their Account Manager.</p>`,
      }),
    });
  }
}

async function handleSubscriptionDeleted(supabase: SupabaseClient, subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  const { error } = await supabase
    .from('tenants')
    .update({
      plan_status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', customerId);

  if (error) throw new Error(`handleSubscriptionDeleted: failed to update tenant: ${error.message}`);
}

async function handlePaymentFailed(supabase: SupabaseClient, invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('business_name, owner_email, preferred_language')
    .eq('stripe_customer_id', customerId)
    .single();

  if (fetchError) throw new Error(`handlePaymentFailed: failed to fetch tenant: ${fetchError.message}`);

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ plan_status: 'past_due' })
    .eq('stripe_customer_id', customerId);

  if (updateError) throw new Error(`handlePaymentFailed: failed to update tenant: ${updateError.message}`);

  if (!tenant?.owner_email) return;

  const amountDue = invoice.amount_due
    ? `$${(invoice.amount_due / 100).toFixed(2)} USD`
    : '';

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set — skipping payment failed email');
    return;
  }

  const { enSubject, esSubject, enHtmlContent, esHtmlContent } = buildPaymentFailedEmail({
    businessName: tenant.business_name,
    amountDue,
    billingUrl: 'https://dashboard.loyalbase.dev/settings/billing',
  });

  const { subject, html } = buildBilingualEmail({ enSubject, esSubject, enHtmlContent, esHtmlContent });

  // Email to tenant
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'LoyaltyOS <billing@loyalbase.dev>',
      to: [tenant.owner_email],
      subject,
      html,
    }),
  });

  // Internal alert
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'LoyaltyOS Billing <billing@loyalbase.dev>',
      to: ['felixdfrometa@gmail.com'],
      subject: `⚠️ Pago fallido: ${tenant.business_name} — ${amountDue}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #dc2626, #7c3aed); padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800;">⚠️ Pago fallido</h1>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px; width: 140px;">Tenant</td>
                <td style="padding: 10px 0; font-weight: 700;">${tenant.business_name}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Email</td>
                <td style="padding: 10px 0;"><a href="mailto:${tenant.owner_email}" style="color: #a78bfa;">${tenant.owner_email}</a></td>
              </tr>
              <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Monto</td>
                <td style="padding: 10px 0; font-weight: 600; color: #f87171;">${amountDue}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Intentos</td>
                <td style="padding: 10px 0;">${invoice.attempt_count ?? 1}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Stripe</td>
                <td style="padding: 10px 0; font-size: 12px;"><a href="https://dashboard.stripe.com/customers/${customerId}" style="color: #a78bfa;">Ver en Stripe</a></td>
              </tr>
            </table>
          </div>
        </div>
      `,
    }),
  });
}

async function handlePaymentSucceeded(supabase: SupabaseClient, invoice: Stripe.Invoice): Promise<void> {
  // Skip zero-amount invoices (e.g. trial activation)
  if (!invoice.amount_paid || invoice.amount_paid === 0) return;

  const customerId = invoice.customer as string;

  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('business_name, owner_email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (fetchError) throw new Error(`handlePaymentSucceeded: failed to fetch tenant: ${fetchError.message}`);

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ plan_status: 'active' })
    .eq('stripe_customer_id', customerId);

  if (updateError) throw new Error(`handlePaymentSucceeded: failed to update tenant: ${updateError.message}`);

  if (!tenant?.owner_email) return;

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  const amountPaid = `$${(invoice.amount_paid / 100).toFixed(2)} USD`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'LoyaltyOS <billing@loyalbase.dev>',
      to: [tenant.owner_email],
      subject: `Payment confirmed — ${amountPaid} / Pago confirmado — ${amountPaid}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #059669, #2563eb); padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800;">✓ Payment confirmed</h1>
            <p style="margin: 6px 0 0; opacity: 0.85; font-size: 14px;">Your LoyaltyOS subscription is active.</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: rgba(255,255,255,0.7); font-size: 14px;">Hi <strong>${tenant.business_name}</strong>, we successfully processed your payment of <strong>${amountPaid}</strong>.</p>
            <p style="color: rgba(255,255,255,0.7); font-size: 14px;">Tu pago de <strong>${amountPaid}</strong> fue procesado con éxito. Tu suscripción a LoyaltyOS está activa.</p>
            <a href="https://dashboard.loyalbase.dev" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Go to Dashboard</a>
          </div>
        </div>
      `,
    }),
  });
}
