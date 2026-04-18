import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { SettingsPageClient } from './SettingsPageClient';
import type { SettingsData } from './SettingsPageClient';

export default async function SettingsPage(): Promise<JSX.Element> {
  const user = await getAuthedUser();

  let initialSettings: SettingsData | null = null;

  if (user) {
    // Service role required: initial settings fetch for Server Component — no session available at server render time
    const service = createServiceRoleClient();

    const { data: ownerTenant, error: ownerError } = await service
      .from('tenants')
      .select('*')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();
    if (ownerError) console.error('[SettingsPage] tenant lookup error:', ownerError);

    let tenant = ownerTenant;

    if (!tenant) {
      const { data: staffRecord, error: staffError } = await service
        .from('tenant_users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      if (staffError) console.error('[SettingsPage] staff lookup error:', staffError);

      if (staffRecord?.tenant_id) {
        const { data: staffTenant, error: staffTenantError } = await service
          .from('tenants')
          .select('*')
          .eq('id', staffRecord.tenant_id)
          .single();
        if (staffTenantError) console.error('[SettingsPage] staffTenant lookup error:', staffTenantError);
        tenant = staffTenant;
      }
    }

    if (tenant) {
      initialSettings = {
        businessName: tenant.business_name ?? '',
        email: tenant.contact_email ?? '',
        businessPhone: tenant.business_phone ?? '',
        businessAddress: tenant.business_address ?? '',
        ownerFirstName: tenant.owner_first_name ?? '',
        ownerLastName: tenant.owner_last_name ?? '',
        ownerPhone: tenant.owner_phone ?? '',
        ownerEmail: tenant.owner_email ?? '',
        secondaryContactFirstName: tenant.secondary_contact_first_name ?? undefined,
        secondaryContactLastName: tenant.secondary_contact_last_name ?? undefined,
        secondaryContactPhone: tenant.secondary_contact_phone ?? undefined,
        secondaryContactEmail: tenant.secondary_contact_email ?? undefined,
        logoUrl: tenant.brand_logo_url ?? null,
        branding: {
          primaryColor: tenant.brand_color_primary ?? '#6366f1',
          accentColor: tenant.brand_color_secondary ?? '#818cf8',
        },
        plan: tenant.plan ?? 'starter',
        planStatus: tenant.plan_status ?? 'active',
        trialEndsAt: tenant.trial_ends_at ?? null,
        pointsPerDollar: tenant.points_per_dollar ?? 1,
        tierSilverThreshold: tenant.tier_silver_threshold ?? 1000,
        tierGoldThreshold: tenant.tier_gold_threshold ?? 5000,
        tierPlatinumThreshold: tenant.tier_platinum_threshold ?? 10000,
        pointsPerVisitEnabled: tenant.points_per_visit_enabled ?? true,
        pointsPerVisit: tenant.points_per_visit ?? 15,
        welcomeBonusEnabled: tenant.welcome_bonus_enabled ?? true,
        welcomeBonusPoints: tenant.welcome_bonus_points ?? 50,
        googleReviewUrl: tenant.google_review_url ?? '',
        googleReviewBonusEnabled: tenant.google_review_bonus_enabled ?? false,
        googleReviewBonusPoints: tenant.google_review_bonus_points ?? 100,
        referralEnabled: tenant.referral_enabled ?? false,
        referralPointsReferrer: tenant.referral_points_referrer ?? 50,
        referralPointsReferee: tenant.referral_points_referee ?? 50,
        hasStripeCustomer: !!tenant.stripe_customer_id,
      };
    }
  }

  return <SettingsPageClient initialSettings={initialSettings} />;
}
