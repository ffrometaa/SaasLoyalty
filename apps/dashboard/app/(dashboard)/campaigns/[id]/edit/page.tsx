import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { redirect, notFound } from 'next/navigation';
import { getCampaignById } from '../../../../../lib/campaigns/queries';
import CampaignForm from '../../../../../components/dashboard/CampaignForm';
import type { Plan } from '../../../../../lib/plans/features';

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

export default async function EditCampaignPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createServerSupabaseClient();
  const tenant = await resolveAuthedTenant(supabase);
  if (!tenant) redirect('/login');

  const campaign = await getCampaignById(tenant.tenantId, params.id);
  if (!campaign) notFound();

  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    redirect('/campaigns');
  }

  return <CampaignForm campaign={campaign} tenantId={tenant.tenantId} />;
}
