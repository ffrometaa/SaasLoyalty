import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createServerSupabaseClient();

    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_name, brand_logo_url, brand_color_primary, brand_color_secondary, plan, plan_status, trial_ends_at, business_phone, business_address, owner_first_name, owner_last_name, owner_phone, owner_email, secondary_contact_first_name, secondary_contact_last_name, secondary_contact_phone, secondary_contact_email, referral_enabled, referral_points_referrer, referral_points_referee, points_per_dollar, tier_silver_threshold, tier_gold_threshold, tier_platinum_threshold')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      businessName: tenant.business_name,
      email: user.email,
      logoUrl: tenant.brand_logo_url,
      businessPhone: tenant.business_phone,
      businessAddress: tenant.business_address,
      ownerFirstName: tenant.owner_first_name,
      ownerLastName: tenant.owner_last_name,
      ownerPhone: tenant.owner_phone,
      ownerEmail: tenant.owner_email,
      secondaryContactFirstName: tenant.secondary_contact_first_name,
      secondaryContactLastName: tenant.secondary_contact_last_name,
      secondaryContactPhone: tenant.secondary_contact_phone,
      secondaryContactEmail: tenant.secondary_contact_email,
      branding: {
        primaryColor: tenant.brand_color_primary || '#6366f1',
        accentColor: tenant.brand_color_secondary || '#818cf8',
      },
      plan: tenant.plan,
      planStatus: tenant.plan_status,
      trialEndsAt: tenant.trial_ends_at,
      referralEnabled: tenant.referral_enabled ?? false,
      referralPointsReferrer: tenant.referral_points_referrer ?? 50,
      referralPointsReferee: tenant.referral_points_referee ?? 50,
      pointsPerDollar: tenant.points_per_dollar ?? 1,
      tierSilverThreshold: tenant.tier_silver_threshold ?? 1000,
      tierGoldThreshold: tenant.tier_gold_threshold ?? 5000,
      tierPlatinumThreshold: tenant.tier_platinum_threshold ?? 10000,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createServerSupabaseClient();

    const body = await request.json();
    const {
      businessName, primaryColor, accentColor, businessPhone, businessAddress,
      ownerFirstName, ownerLastName, ownerPhone, ownerEmail,
      secondaryContactFirstName, secondaryContactLastName, secondaryContactPhone, secondaryContactEmail,
      referralEnabled, referralPointsReferrer, referralPointsReferee,
      pointsPerDollar, tierSilverThreshold, tierGoldThreshold, tierPlatinumThreshold,
    } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (businessName !== undefined) updates.business_name = businessName;
    if (primaryColor !== undefined) updates.brand_color_primary = primaryColor;
    if (accentColor !== undefined) updates.brand_color_secondary = accentColor;
    if (businessPhone !== undefined) updates.business_phone = businessPhone;
    if (businessAddress !== undefined) updates.business_address = businessAddress;
    if (ownerFirstName !== undefined) updates.owner_first_name = ownerFirstName;
    if (ownerLastName !== undefined) updates.owner_last_name = ownerLastName;
    if (ownerPhone !== undefined) updates.owner_phone = ownerPhone;
    if (ownerEmail !== undefined) updates.owner_email = ownerEmail;
    if (secondaryContactFirstName !== undefined) updates.secondary_contact_first_name = secondaryContactFirstName;
    if (secondaryContactLastName !== undefined) updates.secondary_contact_last_name = secondaryContactLastName;
    if (secondaryContactPhone !== undefined) updates.secondary_contact_phone = secondaryContactPhone;
    if (secondaryContactEmail !== undefined) updates.secondary_contact_email = secondaryContactEmail;
    if (referralEnabled !== undefined) updates.referral_enabled = referralEnabled;
    if (referralPointsReferrer !== undefined) updates.referral_points_referrer = Math.max(0, Math.min(10000, Number(referralPointsReferrer)));
    if (referralPointsReferee !== undefined) updates.referral_points_referee = Math.max(0, Math.min(10000, Number(referralPointsReferee)));
    if (pointsPerDollar !== undefined) updates.points_per_dollar = Math.max(1, Math.min(1000, Number(pointsPerDollar)));
    if (tierSilverThreshold !== undefined) updates.tier_silver_threshold = Math.max(1, Number(tierSilverThreshold));
    if (tierGoldThreshold !== undefined) updates.tier_gold_threshold = Math.max(1, Number(tierGoldThreshold));
    if (tierPlatinumThreshold !== undefined) updates.tier_platinum_threshold = Math.max(1, Number(tierPlatinumThreshold));

    const { error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('auth_user_id', user.id)
      .is('deleted_at', null);

    if (error) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
