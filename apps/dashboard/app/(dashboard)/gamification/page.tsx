import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { redirect } from 'next/navigation';
import { GamificationPanel } from '../../../components/dashboard/GamificationPanel';
import { FeatureGate } from '../../../components/dashboard/FeatureGate';
import { getChallenges, getBadges, getGamificationSummary } from '../../../lib/gamification/queries';
import { getTranslations } from 'next-intl/server';
import { planHasFeature } from '../../../lib/plans/features';
import type { Plan } from '../../../lib/plans/features';

async function resolveAuthedTenantId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<{ tenantId: string; plan: Plan } | null> {
  const { data: { session } } = await (supabase.auth as any).getSession();
  if (!session?.user) return null;

  const { data: ownerTenant } = await supabase
    .from('tenants')
    .select('id, plan')
    .eq('auth_user_id', session.user.id)
    .is('deleted_at', null)
    .single();

  if (ownerTenant?.id) return { tenantId: ownerTenant.id, plan: ownerTenant.plan as Plan };

  const { data: staffRecord } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(plan)')
    .eq('auth_user_id', session.user.id)
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

  // If plan doesn't include gamification, show upgrade gate
  if (!planHasFeature(plan, 'gamification')) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <FeatureGate plan={plan} feature="gamification">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </FeatureGate>
      </div>
    );
  }

  const [challenges, badges, summary] = await Promise.all([
    getChallenges(tenantId),
    getBadges(tenantId),
    getGamificationSummary(tenantId),
  ]);

  return (
    <GamificationPanel
      challenges={challenges}
      badges={badges}
      summary={summary}
    />
  );
}
