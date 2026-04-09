import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';
import { redirect } from 'next/navigation';
import { GamificationPanel } from '../../../components/dashboard/GamificationPanel';
import { SectionErrorBoundary } from '../../../components/SectionErrorBoundary';
import { FeatureGate } from '../../../components/dashboard/FeatureGate';
import { TrialBanner } from '../../../components/dashboard/TrialBanner';
import { getChallenges, getBadges, getGamificationSummary } from '../../../lib/gamification/queries';
import { getTranslations } from 'next-intl/server';
import { planHasFeature } from '../../../lib/plans/features';
import type { Plan } from '../../../lib/plans/features';

async function resolveAuthedTenantId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<{ tenantId: string; plan: Plan } | null> {
  const user = await getAuthedUser();
  if (!user) return null;

  const { data: ownerTenant } = await supabase
    .from('tenants')
    .select('id, plan')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (ownerTenant?.id) return { tenantId: ownerTenant.id, plan: ownerTenant.plan as Plan };

  const { data: staffRecord } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(plan)')
    .eq('auth_user_id', user.id)
    .single();

  if (staffRecord?.tenant_id) {
    const plan = (staffRecord.tenants as { plan: string } | null)?.plan ?? 'starter';
    return { tenantId: staffRecord.tenant_id, plan: plan as Plan };
  }

  return null;
}

export default async function GamificationPage() {
  const t = await getTranslations('gamification');
  const supabase = await createServerSupabaseClient();
  const tenant = await resolveAuthedTenantId(supabase);

  if (!tenant) redirect('/login');

  const { tenantId, plan } = tenant;

  // Check for active gamification trial (Starter plan only)
  let gamificationTrial: { status: string; trial_end: string } | null = null;
  if (!planHasFeature(plan, 'gamification')) {
    const { data: trial } = await supabase
      .from('feature_trials')
      .select('status, trial_end')
      .eq('tenant_id', tenantId)
      .eq('feature_name', 'gamification')
      .single();
    gamificationTrial = trial ?? null;
  }

  const hasTrialAccess = gamificationTrial?.status === 'active';
  const trialUsed = gamificationTrial !== null; // has been used (active or expired)

  // If plan doesn't include gamification and no active trial, show upsell card
  if (!planHasFeature(plan, 'gamification') && !hasTrialAccess) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <div className="max-w-2xl mx-auto mt-12">
          <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-8 shadow-sm">
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-violet-100 opacity-40 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-indigo-100 opacity-40 blur-2xl pointer-events-none" />

            <div className="relative">
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                {t('comingSoonBadge')}
              </span>

              {/* Icon + Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('comingSoonTitle')}</h2>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{t('comingSoonDesc')}</p>
                </div>
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 mb-7 mt-5">
                {([t('comingSoonFeature1'), t('comingSoonFeature2'), t('comingSoonFeature3')] as string[]).map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex flex-col items-start gap-3">
                <a
                  href="/settings?tab=billing"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
                >
                  {t('comingSoonCta')}
                </a>
                {!trialUsed && (
                  <a
                    href={`mailto:hello@loyalbase.dev?subject=${encodeURIComponent('45-day Gamification Trial Request')}&body=${encodeURIComponent("Hi, I'm interested in trying the Gamification feature for 45 days.")}`}
                    className="text-sm text-violet-600 hover:text-violet-800 underline underline-offset-2 transition-colors"
                  >
                    {t('trialLinkText')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [challenges, badges, summary] = await Promise.all([
    getChallenges(tenantId),
    getBadges(tenantId),
    getGamificationSummary(tenantId),
  ]);

  return (
    <SectionErrorBoundary section="Gamificación">
      <div className="p-6 lg:p-8">
        {hasTrialAccess && gamificationTrial && (
          <TrialBanner feature="gamification" trialEnd={gamificationTrial.trial_end} />
        )}
        <GamificationPanel
          challenges={challenges}
          badges={badges}
          summary={summary}
        />
      </div>
    </SectionErrorBoundary>
  );
}
