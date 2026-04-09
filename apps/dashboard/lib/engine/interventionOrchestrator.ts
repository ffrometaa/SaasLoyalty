import { createServerSupabaseClient } from '@loyalty-os/lib/server';

type InterventionType =
  | 'bonus_offer'
  | 'personal_challenge'
  | 'tier_reminder'
  | 'win_back_campaign';

/**
 * Mark an intervention as resolved with the given outcome status.
 */
export async function resolveIntervention(
  interventionId = '',
  status: 'sent' | 'dismissed' | 'converted' = 'sent'
) {
  const supabase = await createServerSupabaseClient();
  await supabase
    .from('churn_interventions')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', interventionId);
}

/**
 * Fetch pending interventions for a tenant (dashboard view).
 */
export async function getPendingInterventions(tenantId = '') {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('churn_interventions')
    .select('*, members(name, email, tier)')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('churn_score', { ascending: false });
  return data ?? [];
}

/**
 * Fetch intervention summary stats for a tenant.
 */
export async function getInterventionStats(tenantId = '') {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('churn_interventions')
    .select('status')
    .eq('tenant_id', tenantId);

  const stats = { pending: 0, sent: 0, dismissed: 0, converted: 0 };
  for (const row of data ?? []) {
    const s = row.status as keyof typeof stats;
    if (s in stats) stats[s]++;
  }
  return stats;
}
