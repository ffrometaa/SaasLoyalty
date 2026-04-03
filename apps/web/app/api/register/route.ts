import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Price IDs from environment
const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  scale: process.env.STRIPE_SCALE_PRICE_ID!,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessType, slug, email, userId, plan = 'starter' } = body;

    // Validate input
    if (!businessName || !businessType || !slug || !email || !userId) {
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

    const supabase = createServiceRoleClient();

    // Check if slug is already taken
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingTenant) {
      return NextResponse.json(
        { error: 'This URL is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // Get price ID for the selected plan
    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Create tenant record now so the slug is reserved and the webhook can update it
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

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
      });

    if (tenantError) {
      console.error('Failed to create tenant:', tenantError);
      return NextResponse.json(
        { error: 'Failed to create business profile' },
        { status: 500 }
      );
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
        trial_period_days: 14,
        metadata: {
          tenant_slug: slug,
          business_name: businessName,
          business_type: businessType,
          plan: plan,
        },
      },
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        tenant_slug: slug,
        business_name: businessName,
        business_type: businessType,
        plan: plan,
      },
      success_url: `${dashboardUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
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
