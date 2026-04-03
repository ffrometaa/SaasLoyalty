import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { planHasFeature, canAddMember, canCreateCampaign } from './features';
import type { Feature, Plan } from './features';

export async function getTenantPlan(tenantId: string): Promise<Plan> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('plan, plan_status')
    .eq('id', tenantId)
    .single();

  if (error || !data) throw new Error('Tenant not found');

  if (data.plan_status !== 'active' && data.plan_status !== 'trialing') {
    throw new Error('Subscription is not active');
  }

  return ((data.plan as string) || 'starter') as Plan;
}

export async function requireFeature(tenantId: string, feature: Feature): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  if (!planHasFeature(plan, feature)) {
    throw new Error(
      `Feature '${feature}' is not available on the ${plan} plan. Please upgrade your subscription.`
    );
  }
}

export async function requireMemberSlot(tenantId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const plan = await getTenantPlan(tenantId);

  const { count } = await supabase
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  if (!canAddMember(plan, count ?? 0)) {
    throw new Error(`Member limit reached for your ${plan} plan. Please upgrade.`);
  }
}

export async function requireCampaignSlot(tenantId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const plan = await getTenantPlan(tenantId);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfMonth.toISOString());

  if (!canCreateCampaign(plan, count ?? 0)) {
    throw new Error(
      `Campaign limit reached for this month on your ${plan} plan.`
    );
  }
}
