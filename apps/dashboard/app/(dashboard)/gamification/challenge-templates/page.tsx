import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';
import { redirect } from 'next/navigation';
import { getChallengeTemplates } from '../../../../lib/engine/challenge-template-queries';
import ChallengeTemplateEditor from '../../../../components/dashboard/ChallengeTemplateEditor';
import type { Plan } from '../../../../lib/plans/features';

async function resolveAuthedTenant(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<{ tenantId: string; plan: Plan } | null> {
  const user = await getAuthedUser();
  if (!user) return null;

  const { data: ownerTenant } = await supabase
    .from('tenants').select('id, plan')
    .eq('auth_user_id', user.id).is('deleted_at', null).single();
  if (ownerTenant?.id) return { tenantId: ownerTenant.id, plan: ownerTenant.plan as Plan };

  const { data: staffRecord } = await supabase
    .from('tenant_users').select('tenant_id, tenants(plan)')
    .eq('auth_user_id', user.id).single();
  if (staffRecord?.tenant_id) {
    const plan = (staffRecord.tenants as { plan: string } | null)?.plan ?? 'starter';
    return { tenantId: staffRecord.tenant_id, plan: plan as Plan };
  }
  return null;
}

export default async function ChallengeTemplatesPage() {
  const supabase = await createServerSupabaseClient();
  const tenant = await resolveAuthedTenant(supabase);
  if (!tenant) redirect('/login');

  // Challenge templates are an enterprise feature
  if (tenant.plan !== 'enterprise') redirect('/gamification');

  const templates = await getChallengeTemplates(tenant.tenantId);

  return <ChallengeTemplateEditor templates={templates} />;
}
