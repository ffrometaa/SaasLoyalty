import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import type { BehaviorScore, MotivationType } from './behaviorScoring';
import type { ChallengeType } from './challenge-template-queries';

export type { ChallengeType };

interface ChallengeTemplate {
  type: ChallengeType;
  name: string;
  description: string;
  goalMultiplier: number; // applied to member's recent baseline
  bonusPoints: number;
  ttlDays: number;
}

/**
 * Challenge templates keyed by motivation type.
 * Goals are calibrated to be achievable (~60–80% of baseline * multiplier).
 */
const TEMPLATES: Record<MotivationType, ChallengeTemplate[]> = {
  achiever: [
    {
      type: 'points_earned',
      name: 'Points Powerhouse',
      description: 'Earn more points than ever this week.',
      goalMultiplier: 1.2,
      bonusPoints: 150,
      ttlDays: 7,
    },
    {
      type: 'visit_count',
      name: 'Consistency Champion',
      description: 'Keep your streak alive — visit us every day this week.',
      goalMultiplier: 1.0,
      bonusPoints: 100,
      ttlDays: 7,
    },
  ],
  competitor: [
    {
      type: 'visit_count',
      name: 'Visit Streak',
      description: 'Beat your personal record and climb the leaderboard.',
      goalMultiplier: 1.3,
      bonusPoints: 120,
      ttlDays: 7,
    },
    {
      type: 'streak',
      name: 'Unbroken',
      description: 'Visit 5 days in a row and claim your reward.',
      goalMultiplier: 1.0,
      bonusPoints: 200,
      ttlDays: 10,
    },
  ],
  explorer: [
    {
      type: 'spend_amount',
      name: 'Explorer Bonus',
      description: 'Try something new — spend more and earn extra points.',
      goalMultiplier: 1.1,
      bonusPoints: 80,
      ttlDays: 14,
    },
    {
      type: 'referral',
      name: 'Spread the Word',
      description: 'Bring a friend and earn a bonus.',
      goalMultiplier: 1.0,
      bonusPoints: 250,
      ttlDays: 14,
    },
  ],
  socializer: [
    {
      type: 'referral',
      name: 'Community Builder',
      description: 'Refer two friends and unlock a special reward.',
      goalMultiplier: 1.0,
      bonusPoints: 300,
      ttlDays: 14,
    },
    {
      type: 'visit_count',
      name: 'Social Regular',
      description: 'Visit us with friends this week.',
      goalMultiplier: 1.0,
      bonusPoints: 100,
      ttlDays: 7,
    },
  ],
};

const BASELINE_GOALS: Record<ChallengeType, number> = {
  visit_count: 5,
  points_earned: 300,
  referral: 1,
  spend_amount: 100,
  streak: 5,
};

function computeGoal(type: ChallengeType, score: BehaviorScore, multiplier = 1): number {
  const base = BASELINE_GOALS[type];
  let adjusted = base;

  if (type === 'visit_count') {
    adjusted = Math.max(base, Math.round(score.visitVelocity * 7 * multiplier));
  } else if (type === 'points_earned') {
    adjusted = Math.max(base, Math.round(score.pointsVelocity * multiplier));
  } else {
    adjusted = Math.round(base * multiplier);
  }

  return Math.max(1, adjusted);
}

/**
 * Load templates for a tenant — custom overrides if defined, defaults otherwise.
 * Custom templates are stored per (tenant, motivation_type, challenge_type).
 * If a tenant has no custom templates, the built-in TEMPLATES are used.
 */
async function loadTemplatesForTenant(tenantId: string): Promise<Record<MotivationType, ChallengeTemplate[]>> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('tenant_challenge_templates')
    .select('motivation_type, challenge_type, name, description, bonus_points, ttl_days, goal_multiplier')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (!data || data.length === 0) return TEMPLATES;

  // Group custom templates by motivation_type; fall back to built-in for missing types
  const custom: Record<MotivationType, ChallengeTemplate[]> = { ...TEMPLATES };

  for (const motivationType of Object.keys(TEMPLATES) as MotivationType[]) {
    const rows = data.filter((r: { motivation_type: string; challenge_type: string; name: string; description: string; bonus_points: number; ttl_days: number; goal_multiplier: number }) => r.motivation_type === motivationType);
    if (rows.length > 0) {
      custom[motivationType] = rows.map(r => ({
        type: r.challenge_type as ChallengeType,
        name: r.name,
        description: r.description,
        goalMultiplier: r.goal_multiplier,
        bonusPoints: r.bonus_points,
        ttlDays: r.ttl_days,
      }));
    }
  }

  return custom;
}

/**
 * Generate a personalized dynamic challenge for one member based on their behavior score.
 * Returns null if the member already has an active non-dismissed dynamic challenge.
 */
export async function generateDynamicChallenge(score: BehaviorScore) {
  const supabase = await createServerSupabaseClient();

  // Skip if member already has an active dynamic challenge
  const { data: existing } = await supabase
    .from('dynamic_challenges')
    .select('id')
    .eq('member_id', score.memberId)
    .is('completed_at', null)
    .eq('is_dismissed', false)
    .gt('expires_at', new Date().toISOString())
    .limit(1);

  if (existing && existing.length > 0) return null;

  const allTemplates = await loadTemplatesForTenant(score.tenantId);
  const templates = allTemplates[score.motivationType];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const goalValue = computeGoal(template.type, score, template.goalMultiplier);
  const expiresAt = new Date(Date.now() + template.ttlDays * 86400000).toISOString();

  const { data, error } = await supabase
    .from('dynamic_challenges')
    .insert({
      tenant_id: score.tenantId,
      member_id: score.memberId,
      name: template.name,
      description: template.description,
      type: template.type,
      goal_value: goalValue,
      bonus_points: template.bonusPoints,
      current_value: 0,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) return null;
  return data;
}

/**
 * Fetch active dynamic challenges for a member.
 */
export async function getMemberDynamicChallenges(memberId = '') {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('dynamic_challenges')
    .select('*')
    .eq('member_id', memberId)
    .eq('is_dismissed', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  return data ?? [];
}
