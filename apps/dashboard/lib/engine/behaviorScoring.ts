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

interface MemberRow {
  id: string;
  tenant_id: string;
  points_balance: number;
  points_lifetime: number;
  status: string;
}

interface VisitStat {
  member_id: string;
  visit_count: number;
  last_visit_at: string | null;
  points_earned_30d: number;
}

interface ChallengeProgressStat {
  member_id: string;
  completed_count: number;
}

/**
 * Classify motivation type from behavioral signals.
 * - achiever:   high points velocity, completes challenges
 * - competitor: high visit velocity, consistent streaks
 * - socializer: above-average referral activity
 * - explorer:   wide variety of challenge types attempted
 */
function classifyMotivation(
  visitVelocity = 0,
  pointsVelocity = 0,
  challengesCompleted = 0
): MotivationType {
  if (challengesCompleted >= 3) return 'achiever';
  if (visitVelocity >= 8) return 'competitor';
  if (pointsVelocity >= 500) return 'achiever';
  if (visitVelocity >= 4) return 'explorer';
  return 'socializer';
}

/**
 * Compute churn score (0–1).
 * Weights: recency (50%), velocity drop (30%), status (20%).
 */
function computeChurnScore(
  daysSinceVisit = 0,
  visitVelocity = 0,
  memberStatus = 'active'
): number {
  if (memberStatus !== 'active') return 1;

  const recencyScore = Math.min(daysSinceVisit / 90, 1); // 0 at 0 days, 1 at 90+
  const velocityScore = visitVelocity <= 0 ? 1 : Math.max(0, 1 - visitVelocity / 10);

  return Math.min(1, recencyScore * 0.5 + velocityScore * 0.3 + 0.2);
}

/**
 * Compute engagement score (0–1).
 * Weights: velocity (50%), challenge completions (30%), balance growth (20%).
 */
function computeEngagementScore(
  visitVelocity = 0,
  challengesCompleted = 0,
  pointsVelocity = 0
): number {
  const velocityFactor = Math.min(visitVelocity / 12, 1);
  const challengeFactor = Math.min(challengesCompleted / 5, 1);
  const pointsFactor = Math.min(pointsVelocity / 1000, 1);

  return Math.min(1, velocityFactor * 0.5 + challengeFactor * 0.3 + pointsFactor * 0.2);
}

/**
 * Score all active members for a given tenant.
 * Returns upserted BehaviorScore records.
 */
export async function scoreTenantMembers(tenantId = ''): Promise<BehaviorScore[]> {
  const supabase = await createServerSupabaseClient();

  const [membersRes, visitStatsRes, challengeStatsRes] = await Promise.all([
    supabase
      .from('members')
      .select('id, tenant_id, points_balance, points_lifetime, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active'),

    supabase.rpc('get_member_visit_stats', { p_tenant_id: tenantId }),

    supabase
      .from('member_challenge_progress')
      .select('member_id, challenge_id')
      .eq('tenant_id', tenantId)
      .not('completed_at', 'is', null),
  ]);

  const members = (membersRes.data ?? []) as MemberRow[];
  const visitStats = (visitStatsRes.data ?? []) as VisitStat[];
  const challengeRaw = challengeStatsRes.data ?? [];

  // Build lookup maps
  const visitMap: Record<string, VisitStat> = {};
  for (const v of visitStats) visitMap[v.member_id] = v;

  const challengeMap: Record<string, number> = {};
  for (const row of challengeRaw) {
    const r = row as { member_id: string };
    challengeMap[r.member_id] = (challengeMap[r.member_id] ?? 0) + 1;
  }

  const scores: BehaviorScore[] = [];
  const now = new Date();

  for (const member of members) {
    const stat = visitMap[member.id];
    const lastVisit = stat?.last_visit_at ? new Date(stat.last_visit_at) : null;
    const daysSinceVisit = lastVisit
      ? Math.floor((now.getTime() - lastVisit.getTime()) / 86400000)
      : 999;

    const visitVelocity = stat?.visit_count ? stat.visit_count / 30 : 0;
    const pointsVelocity = stat?.points_earned_30d ?? 0;
    const challengesCompleted = challengeMap[member.id] ?? 0;

    const churnScore = computeChurnScore(daysSinceVisit, visitVelocity, member.status);
    const engagementScore = computeEngagementScore(visitVelocity, challengesCompleted, pointsVelocity);
    const motivationType = classifyMotivation(visitVelocity, pointsVelocity, challengesCompleted);

    scores.push({
      memberId: member.id,
      tenantId,
      churnScore: parseFloat(churnScore.toFixed(3)),
      engagementScore: parseFloat(engagementScore.toFixed(3)),
      motivationType,
      visitVelocity: parseFloat(visitVelocity.toFixed(2)),
      pointsVelocity: parseFloat(pointsVelocity.toFixed(2)),
      daysSinceVisit,
    });
  }

  // Upsert all scores in one call
  if (scores.length > 0) {
    await supabase.from('member_behavior_scores').upsert(
      scores.map(s => ({
        tenant_id: s.tenantId,
        member_id: s.memberId,
        churn_score: s.churnScore,
        engagement_score: s.engagementScore,
        motivation_type: s.motivationType,
        visit_velocity: s.visitVelocity,
        points_velocity: s.pointsVelocity,
        days_since_visit: s.daysSinceVisit,
        scored_at: new Date().toISOString(),
      })),
      { onConflict: 'member_id' }
    );
  }

  return scores;
}

/**
 * Fetch the latest behavior scores for a tenant, ordered by churn risk.
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
