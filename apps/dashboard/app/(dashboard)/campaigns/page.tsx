import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { redirect } from 'next/navigation';
import { getCampaigns, getCampaignStatusCounts, getCampaignsThisMonth } from '../../../lib/campaigns/queries';
import { PLAN_CONFIGS } from '../../../lib/plans/features';
import CampaignsList from '../../../components/dashboard/CampaignsList';
import { SectionErrorBoundary } from '../../../components/SectionErrorBoundary';
import type { Plan } from '../../../lib/plans/features';

async function resolveAuthedTenant(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<{ tenantId: string; plan: Plan } | null> {
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

export default async function CampaignsPage() {
  const supabase = await createServerSupabaseClient();
  const tenant = await resolveAuthedTenant(supabase);

  if (!tenant) redirect('/login');

  const { tenantId, plan } = tenant;

  const [{ campaigns }, statusCounts, currentMonthCount] = await Promise.all([
    getCampaigns(tenantId),
    getCampaignStatusCounts(tenantId),
    getCampaignsThisMonth(tenantId),
  ]);

  const planConfig = PLAN_CONFIGS[plan];
  const planLimit = planConfig.maxCampaignsPerMonth;

  return (
    <SectionErrorBoundary section="Campañas">
      <CampaignsList
        campaigns={campaigns}
        statusCounts={statusCounts}
        planLimit={planLimit}
        currentMonthCount={currentMonthCount}
      />
    </SectionErrorBoundary>
  );
}
