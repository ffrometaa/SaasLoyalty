import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export type MotivationType = 'achiever' | 'socializer' | 'explorer' | 'competitor';

export interface BehaviorScore {
  memberId: string;
  tenantId: string;
  churnScore: number;       // 0–1, higher = more likely to churn
  engagementScore: number;  // 0–1, higher = more engaged
  motivationType: MotivationType;
  visitVelocity: number;    // avg visits per 30 days
  pointsVelocity: number;   // avg points earned per 30 days
  daysSinceVisit: number;
}

/**
 * Fetch the latest behavior scores for a tenant, ordered by churn risk.
 * Scores are computed exclusively by the run-scoring-engine edge function.
 */
export async function getTenantBehaviorScores(tenantId = '') {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('member_behavior_scores')
    .select('*, members(name, email, tier)')
    .eq('tenant_id', tenantId)
    .order('churn_score', { ascending: false });
  return data ?? [];
}
