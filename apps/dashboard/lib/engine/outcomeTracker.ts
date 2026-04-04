import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export interface EngineRunOutcome {
  tenantId: string;
  membersScored: number;
  challengesGenerated: number;
  interventionsTriggered: number;
  leaderboardUpdated: boolean;
  durationMs: number;
  errors: string[];
}

/**
 * Persist an engine run summary to the activity log.
 */
export async function logEngineRun(outcome: EngineRunOutcome) {
  const supabase = await createServerSupabaseClient();
  await supabase.from('engine_activity_log').insert({
    tenant_id: outcome.tenantId || null,
    event_type: 'scoring_run',
    payload: {
      challenges_generated: outcome.challengesGenerated,
      interventions_triggered: outcome.interventionsTriggered,
      leaderboard_updated: outcome.leaderboardUpdated,
      errors: outcome.errors,
    },
    members_affected: outcome.membersScored,
    duration_ms: outcome.durationMs,
  });
}

/**
 * Log a specific notable event (intervention triggered, mission completed, etc.).
 */
export async function logEngineEvent(
  eventType = '',
  tenantId = '',
  membersAffected = 0,
  payload: Record<string, unknown> = {}
) {
  const supabase = await createServerSupabaseClient();
  await supabase.from('engine_activity_log').insert({
    tenant_id: tenantId || null,
    event_type: eventType,
    payload,
    members_affected: membersAffected,
  });
}

/**
 * Fetch recent engine activity for the dashboard activity feed.
 */
export async function getRecentEngineActivity(tenantId = '', limit = 20) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('engine_activity_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

/**
 * Fetch engine activity across all tenants (super admin view).
 */
export async function getAllEngineActivity(limit = 50) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('engine_activity_log')
    .select('*, tenants(business_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

/**
 * Aggregate engine stats for a tenant — used by the dashboard overview cards.
 */
export async function getEngineSummaryStats(tenantId = '') {
  const supabase = await createServerSupabaseClient();

  const [scoresRes, interventionsRes, dynamicRes, missionRes] = await Promise.all([
    supabase
      .from('member_behavior_scores')
      .select('churn_score, engagement_score')
      .eq('tenant_id', tenantId),

    supabase
      .from('churn_interventions')
      .select('status')
      .eq('tenant_id', tenantId),

    supabase
      .from('dynamic_challenges')
      .select('completed_at')
      .eq('tenant_id', tenantId),

    supabase
      .from('member_mission_progress')
      .select('completed_at')
      .eq('tenant_id', tenantId)
      .not('completed_at', 'is', null),
  ]);

  interface ScoreRow { churn_score: number; engagement_score: number }
  interface InterventionRow { status: string }
  interface DynamicRow { completed_at: string | null }

  const scores = (scoresRes.data ?? []) as ScoreRow[];
  const avgChurn = scores.length
    ? scores.reduce((sum: number, s: ScoreRow) => sum + s.churn_score, 0) / scores.length
    : 0;
  const avgEngagement = scores.length
    ? scores.reduce((sum: number, s: ScoreRow) => sum + s.engagement_score, 0) / scores.length
    : 0;
  const highRisk = scores.filter((s: ScoreRow) => s.churn_score >= 0.6).length;

  const interventions = (interventionsRes.data ?? []) as InterventionRow[];
  const pendingInterventions = interventions.filter((i: InterventionRow) => i.status === 'pending').length;
  const convertedInterventions = interventions.filter((i: InterventionRow) => i.status === 'converted').length;

  const dynamicChallenges = (dynamicRes.data ?? []) as DynamicRow[];
  const completedDynamic = dynamicChallenges.filter((d: DynamicRow) => d.completed_at).length;

  return {
    membersScored: scores.length,
    avgChurnScore: parseFloat(avgChurn.toFixed(3)),
    avgEngagementScore: parseFloat(avgEngagement.toFixed(3)),
    highRiskCount: highRisk,
    pendingInterventions,
    convertedInterventions,
    dynamicChallengesCompleted: completedDynamic,
    missionsCompleted: (missionRes.data ?? []).length,
  };
}
