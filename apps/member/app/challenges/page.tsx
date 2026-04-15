import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerUser } from '@/lib/supabase';
import { getMemberWithTenant } from '@/lib/member/queries';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { BottomNav } from '@/components/member/BottomNav';
import { BrandTheme } from '@/components/member/BrandTheme';

interface ChallengeRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  goal_value: number;
  bonus_points: number;
  status: string;
}

interface ProgressRow {
  challenge_id: string;
  current_value: number;
  completed_at: string | null;
}

interface MissionRow {
  id: string;
  name: string;
  description: string | null;
  bonus_points: number;
  starts_at: string | null;
  ends_at: string | null;
  mission_steps: Array<{ step_order: number; challenge_id: string }>;
}

interface MissionProgressRow {
  mission_id: string;
  steps_completed: number;
  completed_at: string | null;
}

interface DynamicChallengeRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  goal_value: number;
  bonus_points: number;
  current_value: number;
  expires_at: string;
}

async function getMemberChallenges(tenantId: string, memberId: string) {
  const supabase = await createServerSupabaseClient();

  const [challengesResult, progressResult] = await Promise.all([
    supabase
      .from('challenges')
      .select('id, name, description, type, goal_value, bonus_points, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('member_challenge_progress')
      .select('challenge_id, current_value, completed_at')
      .eq('tenant_id', tenantId)
      .eq('member_id', memberId),
  ]);

  const challenges = (challengesResult.data ?? []) as ChallengeRow[];
  const progress = (progressResult.data ?? []) as ProgressRow[];

  const progressMap: Record<string, ProgressRow> = {};
  for (const p of progress) {
    progressMap[p.challenge_id] = p;
  }

  return challenges.map((c) => ({
    ...c,
    currentValue: progressMap[c.id]?.current_value ?? 0,
    completedAt: progressMap[c.id]?.completed_at ?? null,
  }));
}

async function getMemberMissions(tenantId: string, memberId: string) {
  const supabase = await createServerSupabaseClient();

  const [missionsResult, progressResult] = await Promise.all([
    supabase
      .from('missions')
      .select('id, name, description, bonus_points, starts_at, ends_at, mission_steps(step_order, challenge_id)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('member_mission_progress')
      .select('mission_id, steps_completed, completed_at')
      .eq('tenant_id', tenantId)
      .eq('member_id', memberId),
  ]);

  const missions = (missionsResult.data ?? []) as MissionRow[];
  const progress = (progressResult.data ?? []) as MissionProgressRow[];

  const progressMap: Record<string, MissionProgressRow> = {};
  for (const p of progress) {
    progressMap[p.mission_id] = p;
  }

  return missions.map((m) => ({
    ...m,
    stepsCompleted: progressMap[m.id]?.steps_completed ?? 0,
    totalSteps: m.mission_steps.length,
    completedAt: progressMap[m.id]?.completed_at ?? null,
  }));
}

async function getMemberDynamicChallenges(tenantId: string, memberId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('dynamic_challenges')
    .select('id, name, description, type, goal_value, bonus_points, current_value, expires_at')
    .eq('tenant_id', tenantId)
    .eq('member_id', memberId)
    .eq('is_dismissed', false)
    .is('completed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(3);
  return (data ?? []) as DynamicChallengeRow[];
}

// TYPE_LABELS resolved dynamically from translations in the component

const TYPE_ICONS: Record<string, string> = {
  visit_count: '🎯',
  points_earned: '⭐',
  referral: '⚡',
  spend_amount: '🏆',
  streak: '🔥',
};

export default async function ChallengesPage() {
  const t = await getTranslations('challenges');
  const TYPE_LABELS: Record<string, string> = {
    visit_count: t('typeLabels.visit_count'),
    points_earned: t('typeLabels.points_earned'),
    referral: t('typeLabels.referral'),
    spend_amount: t('typeLabels.spend_amount'),
    streak: t('typeLabels.streak'),
  };
  const user = await getServerUser();
  if (!user) redirect('/login');

  const tenantId = (await cookies()).get('loyalty_tenant_id')?.value;
  const member = await getMemberWithTenant(user.id, tenantId);
  if (!member) redirect('/login');

  const [challenges, missions, dynamicChallenges] = await Promise.all([
    getMemberChallenges(member.tenant_id, member.id),
    getMemberMissions(member.tenant_id, member.id).catch(() => []),
    getMemberDynamicChallenges(member.tenant_id, member.id).catch(() => []),
  ]);

  const activeChallenges = challenges.filter((c) => !c.completedAt);
  const completedChallenges = challenges.filter((c) => !!c.completedAt);
  const activeMissions = missions.filter((m) => !m.completedAt);
  const completedMissions = missions.filter((m) => !!m.completedAt);

  const hasContent = challenges.length > 0 || missions.length > 0 || dynamicChallenges.length > 0;

  return (
    <>
      <BrandTheme
        primary={member.tenant.brand_color_primary}
        secondary={member.tenant.brand_color_secondary}
      />

      <main
        className="min-h-screen pb-24"
        style={{ background: 'var(--cream)' }}
      >
        {/* Header */}
        <div
          className="px-5 pt-12 pb-6"
          style={{ background: 'var(--brand-primary)' }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">{t('title')}</h1>
          <p className="text-white/70 text-sm">{t('subtitle')}</p>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* Empty state */}
          {!hasContent && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎯</div>
              <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text)' }}>
                {t('empty')}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('emptyDesc')}
              </p>
            </div>
          )}

          {/* ── PERSONALIZED (dynamic) challenges ── */}
          {dynamicChallenges.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--text)' }}>
                  {t('justForYou')}
                </h2>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ background: 'var(--brand-primary)' }}
                >
                  {t('personalized')}
                </span>
              </div>
              <div className="space-y-3">
                {dynamicChallenges.map((dc) => {
                  const pct = Math.min(100, Math.round((dc.current_value / dc.goal_value) * 100));
                  const icon = TYPE_ICONS[dc.type] ?? '🎯';
                  const typeLabel = TYPE_LABELS[dc.type] ?? dc.type;
                  const expiresIn = Math.max(0, Math.ceil(
                    (new Date(dc.expires_at).getTime() - Date.now()) / 86400000
                  ));
                  return (
                    <div
                      key={dc.id}
                      className="rounded-2xl p-4"
                      style={{
                        background: 'white',
                        border: '2px solid var(--brand-primary)',
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl leading-none mt-0.5">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {dc.name}
                          </p>
                          {dc.description && (
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>
                              {dc.description}
                            </p>
                          )}
                          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                            {typeLabel} · {t('goal', { value: dc.goal_value, days: expiresIn })}
                          </p>
                        </div>
                        {dc.bonus_points > 0 && (
                          <div
                            className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ background: 'var(--brand-primary)' }}
                          >
                            +{dc.bonus_points} pts
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                            {dc.current_value} / {dc.goal_value}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary-dark)' }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: 'var(--brand-primary)' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── MISSIONS ── */}
          {activeMissions.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('missions')}
              </h2>
              <div className="space-y-3">
                {activeMissions.map((m) => {
                  const pct = m.totalSteps > 0
                    ? Math.round((m.stepsCompleted / m.totalSteps) * 100)
                    : 0;
                  return (
                    <div
                      key={m.id}
                      className="rounded-2xl p-4"
                      style={{ background: 'white', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl leading-none mt-0.5">🗺️</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {m.name}
                          </p>
                          {m.description && (
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>
                              {m.description}
                            </p>
                          )}
                          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                            {t('stepsProgress', { completed: m.stepsCompleted, total: m.totalSteps })}
                          </p>
                        </div>
                        {m.bonus_points > 0 && (
                          <div
                            className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'var(--brand-primary-light, #ede9fe)',
                              color: 'var(--brand-primary-dark)',
                            }}
                          >
                            +{m.bonus_points} pts
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                            {t('stepOf', { current: m.stepsCompleted, total: m.totalSteps })}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary-dark)' }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: 'var(--brand-primary)' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── ACTIVE CHALLENGES ── */}
          {activeChallenges.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('inProgress')}
              </h2>
              <div className="space-y-3">
                {activeChallenges.map((challenge) => {
                  const pct = Math.min(
                    100,
                    Math.round((challenge.currentValue / challenge.goal_value) * 100)
                  );
                  const icon = TYPE_ICONS[challenge.type] ?? '🎯';
                  const typeLabel = TYPE_LABELS[challenge.type] ?? challenge.type;

                  return (
                    <div
                      key={challenge.id}
                      className="rounded-2xl p-4"
                      style={{ background: 'white', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl leading-none mt-0.5">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {challenge.name}
                          </p>
                          {challenge.description && (
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>
                              {challenge.description}
                            </p>
                          )}
                          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                            {typeLabel} · {t('goalSimple', { value: challenge.goal_value })}
                          </p>
                        </div>
                        {challenge.bonus_points > 0 && (
                          <div
                            className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'var(--brand-primary-light, #ede9fe)',
                              color: 'var(--brand-primary-dark)',
                            }}
                          >
                            +{challenge.bonus_points} pts
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                            {challenge.currentValue} / {challenge.goal_value}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary-dark)' }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: 'var(--brand-primary)' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── COMPLETED ── */}
          {(completedChallenges.length > 0 || completedMissions.length > 0) && (
            <section>
              <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('completedSection')}
              </h2>
              <div className="space-y-3">
                {completedMissions.map((m) => (
                  <div
                    key={`m-${m.id}`}
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: 'white', border: '1px solid var(--border)', opacity: 0.75 }}
                  >
                    <span className="text-2xl leading-none">🗺️</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{m.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{t('missionCompleted')}</p>
                    </div>
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full" style={{ background: '#d1fae5' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                ))}
                {completedChallenges.map((challenge) => {
                  const icon = TYPE_ICONS[challenge.type] ?? '🎯';
                  return (
                    <div
                      key={challenge.id}
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{ background: 'white', border: '1px solid var(--border)', opacity: 0.75 }}
                    >
                      <span className="text-2xl leading-none">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{challenge.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{t('challengeCompleted')}</p>
                      </div>
                      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full" style={{ background: '#d1fae5' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
