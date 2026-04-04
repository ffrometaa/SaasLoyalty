import { createServerSupabaseClient } from '@loyalty-os/lib/server';

type InterventionType =
  | 'bonus_offer'
  | 'personal_challenge'
  | 'tier_reminder'
  | 'win_back_campaign';

interface ScoreRow {
  member_id: string;
  tenant_id: string;
  churn_score: number;
  engagement_score: number;
  motivation_type: string;
  days_since_visit: number;
}

interface ExistingIntervention {
  member_id: string;
}

/**
 * Choose the most appropriate intervention type for a member's churn profile.
 * Higher churn = more aggressive intervention.
 */
function selectInterventionType(
  churnScore = 0,
  daysSinceVisit = 0,
  engagementScore = 0
): InterventionType {
  if (churnScore >= 0.85 || daysSinceVisit >= 60) return 'win_back_campaign';
  if (churnScore >= 0.70) return 'bonus_offer';
  if (engagementScore >= 0.4) return 'personal_challenge';
  return 'tier_reminder';
}

/**
 * Trigger interventions for all at-risk members in a tenant.
 * Skips members who already have a pending/sent intervention.
 * Returns the count of new interventions created.
 */
export async function runInterventionsForTenant(
  tenantId = '',
  churnThreshold = 0.6
): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const [scoresRes, existingRes] = await Promise.all([
    supabase
      .from('member_behavior_scores')
      .select('member_id, tenant_id, churn_score, engagement_score, motivation_type, days_since_visit')
      .eq('tenant_id', tenantId)
      .gte('churn_score', churnThreshold),

    supabase
      .from('churn_interventions')
      .select('member_id')
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'sent']),
  ]);

  const scores = (scoresRes.data ?? []) as ScoreRow[];
  const existingSet = new Set(
    ((existingRes.data ?? []) as ExistingIntervention[]).map(i => i.member_id)
  );

  const toCreate = scores.filter(s => !existingSet.has(s.member_id));
  if (toCreate.length === 0) return 0;

  const rows = toCreate.map(s => ({
    tenant_id: s.tenant_id,
    member_id: s.member_id,
    churn_score: s.churn_score,
    intervention_type: selectInterventionType(
      s.churn_score,
      s.days_since_visit,
      s.engagement_score
    ),
    status: 'pending' as const,
    triggered_at: new Date().toISOString(),
    metadata: {
      motivation_type: s.motivation_type,
      engagement_score: s.engagement_score,
      days_since_visit: s.days_since_visit,
    },
  }));

  const { error } = await supabase.from('churn_interventions').insert(rows);
  if (error) return 0;
  return rows.length;
}

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
