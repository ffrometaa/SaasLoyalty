import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

type ChallengeType = 'visit_count' | 'points_earned' | 'referral' | 'spend_amount' | 'streak';
type MotivationType = 'achiever' | 'socializer' | 'explorer' | 'competitor';

interface MemberStat {
  id: string;
  tenant_id: string;
  status: string;
  tier: string;
  points_lifetime: number;
  visit_count_30d: number;
  points_earned_30d: number;
  last_visit_at: string | null;
  challenges_completed: number;
  member_since: string;
}

interface RequestBody {
  trigger?: string;
  tasks?: string[];
  tenant_id?: string;
}

function daysBetween(from: string | null, to: Date): number {
  if (!from) return 999;
  return Math.floor((to.getTime() - new Date(from).getTime()) / 86400000);
}

function computeChurnScore(daysSince: number, visitVelocity: number, status: string): number {
  if (status !== 'active') return 1;
  const recency = Math.min(daysSince / 90, 1);
  const velocity = visitVelocity <= 0 ? 1 : Math.max(0, 1 - visitVelocity / 10);
  return parseFloat(Math.min(1, recency * 0.5 + velocity * 0.3 + 0.2).toFixed(3));
}

function computeEngagementScore(visitVel: number, completed: number, pointsVel: number): number {
  const v = Math.min(visitVel / 12, 1);
  const c = Math.min(completed / 5, 1);
  const p = Math.min(pointsVel / 1000, 1);
  return parseFloat(Math.min(1, v * 0.5 + c * 0.3 + p * 0.2).toFixed(3));
}

function classifyMotivation(visitVel: number, pointsVel: number, completed: number): MotivationType {
  if (completed >= 3) return 'achiever';
  if (visitVel >= 8) return 'competitor';
  if (pointsVel >= 500) return 'achiever';
  if (visitVel >= 4) return 'explorer';
  return 'socializer';
}

const CHALLENGE_TEMPLATES: Record<MotivationType, { type: ChallengeType; name: string; description: string; bonusPoints: number; ttlDays: number; goalBase: number }> = {
  achiever:   { type: 'points_earned', name: 'Points Powerhouse', description: 'Earn more points than ever this week.', bonusPoints: 150, ttlDays: 7, goalBase: 300 },
  competitor: { type: 'visit_count',   name: 'Visit Streak',      description: 'Beat your personal record and climb the leaderboard.', bonusPoints: 120, ttlDays: 7, goalBase: 5 },
  explorer:   { type: 'spend_amount',  name: 'Explorer Bonus',    description: 'Try something new — spend more and earn extra points.', bonusPoints: 80, ttlDays: 14, goalBase: 100 },
  socializer: { type: 'referral',      name: 'Community Builder', description: 'Refer two friends and unlock a special reward.', bonusPoints: 300, ttlDays: 14, goalBase: 2 },
};

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Validate CRON_SECRET — required for all callers (pg_cron, manual, etc.)
  const authHeader = req.headers.get('Authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const started = Date.now();

  let body: RequestBody = {};
  try {
    body = await req.json();
  } catch (_) {
    // empty body is fine for cron triggers
  }

  const runTasks: string[] = body.tasks ?? ['score', 'challenges', 'interventions', 'leaderboard'];
  const filterTenant: string | null = body.tenant_id ?? null;

  let totalMembersScored = 0;
  let totalChallengesCreated = 0;
  let totalInterventions = 0;
  const errors: string[] = [];

  try {
    // ── 1. Fetch all active enterprise tenants (or single tenant if specified)
    let tenantsQuery = supabase
      .from('tenants')
      .select('id')
      .eq('plan', 'enterprise')
      .eq('plan_status', 'active');

    if (filterTenant) tenantsQuery = tenantsQuery.eq('id', filterTenant);

    const { data: tenants, error: tenantErr } = await tenantsQuery;
    if (tenantErr) throw tenantErr;

    for (const tenant of tenants ?? []) {
      const tenantId: string = tenant.id;

      if (runTasks.includes('score') || runTasks.includes('challenges') || runTasks.includes('interventions')) {
        // ── 2. Gather member stats via SQL
        const { data: stats, error: statsErr } = await supabase.rpc(
          'get_member_engine_stats',
          { p_tenant_id: tenantId }
        );
        if (statsErr) { errors.push(`stats: ${statsErr.message}`); continue; }

        const members = (stats ?? []) as MemberStat[];
        const now = new Date();

        const scoreUpserts = [];
        const challengeInserts = [];
        const interventionInserts = [];

        // ── Fetch existing active dynamic challenges (to skip re-creation)
        const { data: existingDynamic } = await supabase
          .from('dynamic_challenges')
          .select('member_id')
          .eq('tenant_id', tenantId)
          .eq('is_dismissed', false)
          .is('completed_at', null)
          .gt('expires_at', now.toISOString());

        const hasActiveDynamic = new Set((existingDynamic ?? []).map((d: { member_id: string }) => d.member_id));

        // ── Fetch existing pending interventions (to skip duplicates)
        const { data: existingInterventions } = await supabase
          .from('churn_interventions')
          .select('member_id')
          .eq('tenant_id', tenantId)
          .in('status', ['pending', 'sent']);

        const hasIntervention = new Set((existingInterventions ?? []).map((i: { member_id: string }) => i.member_id));

        for (const m of members) {
          const daysSince = daysBetween(m.last_visit_at, now);
          const visitVel = m.visit_count_30d / 30;
          const pointsVel = m.points_earned_30d;
          const churnScore = computeChurnScore(daysSince, visitVel, m.status);
          const engScore = computeEngagementScore(visitVel, m.challenges_completed, pointsVel);
          const motivation = classifyMotivation(visitVel, pointsVel, m.challenges_completed);
          const daysSinceJoin = daysBetween(m.member_since, now);

          // Score upsert
          if (runTasks.includes('score')) {
            scoreUpserts.push({
              tenant_id: tenantId,
              member_id: m.id,
              churn_score: churnScore,
              engagement_score: engScore,
              motivation_type: motivation,
              visit_velocity: parseFloat(visitVel.toFixed(2)),
              points_velocity: parseFloat(pointsVel.toFixed(2)),
              days_since_visit: daysSince,
              scored_at: now.toISOString(),
            });
          }

          // Dynamic challenge creation for high-churn members
          if (runTasks.includes('challenges') && churnScore >= 0.6 && !hasActiveDynamic.has(m.id)) {
            const tpl = CHALLENGE_TEMPLATES[motivation];
            const goalValue = Math.max(1, tpl.goalBase);
            challengeInserts.push({
              tenant_id: tenantId,
              member_id: m.id,
              name: tpl.name,
              description: tpl.description,
              type: tpl.type,
              goal_value: goalValue,
              bonus_points: tpl.bonusPoints,
              current_value: 0,
              expires_at: new Date(now.getTime() + tpl.ttlDays * 86400000).toISOString(),
            });
          }

          // Intervention for high-churn members
          if (runTasks.includes('interventions') && churnScore >= 0.6 && !hasIntervention.has(m.id)) {
            let interventionType = 'tier_reminder';
            if (churnScore >= 0.85 || daysSince >= 60) interventionType = 'win_back_campaign';
            else if (churnScore >= 0.70) interventionType = 'bonus_offer';
            else if (engScore >= 0.4) interventionType = 'personal_challenge';

            interventionInserts.push({
              tenant_id: tenantId,
              member_id: m.id,
              churn_score: churnScore,
              intervention_type: interventionType,
              status: 'pending',
              triggered_at: now.toISOString(),
              metadata: { motivation, engagement_score: engScore, days_since_visit: daysSince, days_since_join: daysSinceJoin },
            });
          }
        }

        if (scoreUpserts.length > 0) {
          await supabase.from('member_behavior_scores').upsert(scoreUpserts, { onConflict: 'member_id' });
          totalMembersScored += scoreUpserts.length;
        }

        if (challengeInserts.length > 0) {
          await supabase.from('dynamic_challenges').insert(challengeInserts);
          totalChallengesCreated += challengeInserts.length;
        }

        if (interventionInserts.length > 0) {
          await supabase.from('churn_interventions').insert(interventionInserts);
          totalInterventions += interventionInserts.length;
        }
      }

      // ── 3. Leaderboard snapshot
      if (runTasks.includes('leaderboard') || runTasks.includes('leaderboard_monthly') || runTasks.includes('leaderboard_weekly')) {
        const periodTypes: Array<'month' | 'week'> = [];
        if (runTasks.includes('leaderboard') || runTasks.includes('leaderboard_monthly')) periodTypes.push('month');
        if (runTasks.includes('leaderboard') || runTasks.includes('leaderboard_weekly')) periodTypes.push('week');

        for (const periodType of periodTypes) {
          const now2 = new Date();
          let periodKey: string;
          if (periodType === 'month') {
            periodKey = `${now2.getUTCFullYear()}-${String(now2.getUTCMonth() + 1).padStart(2, '0')}`;
          } else {
            const jan1 = new Date(now2.getUTCFullYear(), 0, 1);
            const week = Math.ceil(((now2.getTime() - jan1.getTime()) / 86400000 + jan1.getUTCDay() + 1) / 7);
            periodKey = `${now2.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
          }

          const { data: members2 } = await supabase
            .from('members')
            .select('id, name, tier, points_lifetime')
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .order('points_lifetime', { ascending: false })
            .limit(100);

          const entries = (members2 ?? []).map((m: { id: string; name: string | null; tier: string | null; points_lifetime: number | null }, i: number) => ({
            rank: i + 1,
            memberId: m.id,
            name: m.name ?? 'Member',
            tier: m.tier ?? 'bronze',
            points: m.points_lifetime ?? 0,
            delta: 0,
          }));

          await supabase.from('leaderboard_snapshots').upsert(
            { tenant_id: tenantId, period_key: periodKey, period_type: periodType, entries, generated_at: new Date().toISOString() },
            { onConflict: 'tenant_id,period_key,period_type' }
          );
        }
      }

      // ── 4. Log this tenant's run
      await supabase.from('engine_activity_log').insert({
        tenant_id: tenantId,
        event_type: 'scoring_run',
        payload: {
          trigger: body.trigger ?? 'api',
          tasks: runTasks,
          challenges_generated: totalChallengesCreated,
          interventions_triggered: totalInterventions,
          errors,
        },
        members_affected: totalMembersScored,
        duration_ms: Date.now() - started,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      membersScored: totalMembersScored,
      challengesCreated: totalChallengesCreated,
      interventionsTriggered: totalInterventions,
      durationMs: Date.now() - started,
      errors,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
