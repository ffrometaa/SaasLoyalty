import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@loyalty-os/lib/server';
import Stripe from 'stripe';
import { getRegisterRatelimit } from '@/lib/ratelimit';
import {
  FOUNDING_PARTNER_MAX_SPOTS,
  FOUNDING_PARTNER_TRIAL_DAYS,
  FOUNDING_PARTNER_COUPON_ID,
} from '@loyalty-os/config';

// Required: STRIPE_SECRET_KEY must be defined in all environments — see .env.example
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Price IDs from environment — required: must be defined in all environments
const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!, // Required: see .env.example
  pro: process.env.STRIPE_PRO_PRICE_ID!,          // Required: see .env.example
  scale: process.env.STRIPE_SCALE_PRICE_ID!,      // Required: see .env.example
};

// Annual price IDs — create these in the Stripe dashboard as annual recurring prices
// (monthly_price * 10, billed once per year = 2 months free).
// Set STRIPE_STARTER_ANNUAL_PRICE_ID, STRIPE_PRO_ANNUAL_PRICE_ID, STRIPE_SCALE_ANNUAL_PRICE_ID
// in your environment variables once the Stripe prices are created.
const ANNUAL_PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  pro: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  scale: process.env.STRIPE_SCALE_ANNUAL_PRICE_ID,
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const limiter = getRegisterRatelimit();
    if (limiter) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ?? '127.0.0.1';
      const { success, limit, reset } = await limiter.limit(ip);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json({ error: 'Too many requests' }, {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        });
      }
    }

    const authSupabase = await createServerSupabaseClient();
    const { data: { user: authedUser } } = await authSupabase.auth.getUser();
    if (!authedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessName, businessType, slug, plan = 'starter', billingPeriod = 'monthly', isFoundingPartner = false, acceptedDpa = false } = body;
    const userId = authedUser.id;
    const email = authedUser.email ?? '';

    // Validate input
    if (!businessName || !businessType || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      );
    }

    // Service role required: tenant creation during registration — no session exists yet
    const supabase = createServiceRoleClient();

    // Check if slug is already taken
    const { data: existingTenant, error: slugCheckError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();
    if (slugCheckError && slugCheckError.code !== 'PGRST116') console.error('[register] slug check error:', slugCheckError);

    if (existingTenant) {
      return NextResponse.json(
        { error: 'This URL is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // Check founding partner spots if applicable
    let foundingPartnerNumber: number | null = null;
    if (isFoundingPartner) {
      const { count, error: countError } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_partner', true);

      if (countError) {
        console.error('Failed to count founding partners:', countError);
        return NextResponse.json({ error: 'Failed to verify founding partner availability' }, { status: 500 });
      }

      const taken = count ?? 0;
      if (taken >= FOUNDING_PARTNER_MAX_SPOTS) {
        return NextResponse.json({ error: 'All founding partner spots have been claimed.' }, { status: 409 });
      }

      foundingPartnerNumber = taken + 1;
    }

    // Get price ID for the selected plan (annual takes priority if configured)
    const isAnnual = billingPeriod === 'annual';
    const annualPriceId = ANNUAL_PRICE_IDS[plan as keyof typeof ANNUAL_PRICE_IDS];
    const priceId = (isAnnual && annualPriceId) ? annualPriceId : PRICE_IDS[plan as keyof typeof PRICE_IDS];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Create tenant record now so the slug is reserved and the webhook can update it
    const trialDays = isFoundingPartner ? FOUNDING_PARTNER_TRIAL_DAYS : 14;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        auth_user_id: userId,
        business_name: businessName,
        business_type: businessType,
        slug,
        plan,
        plan_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
        owner_email: email,
        ...(isFoundingPartner && {
          is_founding_partner: true,
          founding_partner_number: foundingPartnerNumber,
          founding_trial_ends_at: trialEndsAt.toISOString(),
        }),
      });

    if (tenantError) {
      console.error('Failed to create tenant:', tenantError);
      return NextResponse.json(
        { error: 'Failed to create business profile' },
        { status: 500 }
      );
    }

    // Record DPA consent if accepted at registration time
    if (acceptedDpa) {
      const { data: newTenant, error: newTenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();
      if (newTenantError) console.error('[register] newTenant lookup error:', newTenantError);

      if (newTenant) {
        await supabase.from('tenant_consents').insert({
          tenant_id: newTenant.id,
          document_id: '00000000-0000-0000-0000-000000000003',
          ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
          user_agent: request.headers.get('user-agent') ?? null,
        });
      }
    }

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.loyalbase.dev';

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          tenant_slug: slug,
          business_name: businessName,
          business_type: businessType,
          plan: plan,
        },
      },
      ...(isFoundingPartner && {
        discounts: [{ coupon: FOUNDING_PARTNER_COUPON_ID }],
      }),
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        tenant_slug: slug,
        business_name: businessName,
        business_type: businessType,
        plan: plan,
      },
      success_url: `${dashboardUrl}/api/auth/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/register?cancelled=true`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
