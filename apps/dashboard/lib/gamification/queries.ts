import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export type ChallengeType = 'visit_count' | 'points_earned' | 'referral' | 'spend_amount' | 'streak';
export type ChallengeStatus = 'active' | 'draft' | 'archived';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Challenge {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  type: ChallengeType;
  goal_value: number;
  bonus_points: number;
  badge_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: ChallengeStatus;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  rarity: BadgeRarity;
  created_at: string;
}

export interface MemberChallengeProgress {
  id: string;
  member_id: string;
  challenge_id: string;
  current_value: number;
  completed_at: string | null;
  bonus_awarded: boolean;
  challenges: Pick<Challenge, 'name' | 'goal_value' | 'bonus_points' | 'type'> | null;
}

export interface GamificationSummary {
  activeChallenges: number;
  totalBadges: number;
  completionsThisMonth: number;
  topChallenge: { name: string; completions: number } | null;
}

// ─── CHALLENGES ────────────────────────────────────────────

export async function getChallenges(tenantId: string): Promise<Challenge[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getChallengeById(tenantId: string, challengeId: string): Promise<Challenge | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', challengeId)
    .single();

  if (error) return null;
  return data;
}

// ─── BADGES ────────────────────────────────────────────────

export async function getBadges(tenantId: string): Promise<Badge[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── PROGRESS ──────────────────────────────────────────────

export async function getMemberProgress(
  tenantId: string,
  memberId: string
): Promise<MemberChallengeProgress[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('member_challenge_progress')
    .select('*, challenges(name, goal_value, bonus_points, type)')
    .eq('tenant_id', tenantId)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── SUMMARY ───────────────────────────────────────────────

export async function getGamificationSummary(tenantId: string): Promise<GamificationSummary> {
  const supabase = await createServerSupabaseClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [challengesResult, badgesResult, completionsResult] = await Promise.all([
    supabase
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active'),
    supabase
      .from('badges')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('member_challenge_progress')
      .select('challenge_id, challenges(name)')
      .eq('tenant_id', tenantId)
      .not('completed_at', 'is', null)
      .gte('completed_at', startOfMonth),
  ]);

  const completions = completionsResult.data ?? [];

  // Count completions per challenge to find the top one
  const countByChallengeId: Record<string, { name: string; completions: number }> = {};
  for (const row of completions) {
    const cid = row.challenge_id as string;
    const challengeName = (row.challenges as { name: string } | null)?.name ?? 'Unknown';
    if (!countByChallengeId[cid]) {
      countByChallengeId[cid] = { name: challengeName, completions: 0 };
    }
    countByChallengeId[cid].completions++;
  }

  const topChallenge = Object.values(countByChallengeId).sort((a, b) => b.completions - a.completions)[0] ?? null;

  return {
    activeChallenges: challengesResult.count ?? 0,
    totalBadges: badgesResult.count ?? 0,
    completionsThisMonth: completions.length,
    topChallenge,
  };
}
