import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase';
import { getMemberWithTenant } from '@/lib/member/queries';
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

const TYPE_LABELS: Record<string, string> = {
  visit_count: 'Visitas',
  points_earned: 'Puntos acumulados',
  referral: 'Referidos',
  spend_amount: 'Monto gastado',
  streak: 'Días consecutivos',
};

const TYPE_ICONS: Record<string, string> = {
  visit_count: '🎯',
  points_earned: '⭐',
  referral: '⚡',
  spend_amount: '🏆',
  streak: '🔥',
};

export default async function ChallengesPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const member = await getMemberWithTenant(user.id);
  if (!member) redirect('/login');

  const challenges = await getMemberChallenges(member.tenant_id, member.id);

  const activeChallenges = challenges.filter((c) => !c.completedAt);
  const completedChallenges = challenges.filter((c) => !!c.completedAt);

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
          <h1
            className="text-2xl font-bold text-white mb-1"
          >
            Desafíos
          </h1>
          <p className="text-white/70 text-sm">
            Completa desafíos y gana puntos extra
          </p>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* No challenges state */}
          {challenges.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎯</div>
              <p
                className="font-semibold text-lg mb-1"
                style={{ color: 'var(--text)' }}
              >
                Sin desafíos activos
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Tu negocio aún no ha creado desafíos. ¡Vuelve pronto!
              </p>
            </div>
          )}

          {/* Active challenges */}
          {activeChallenges.length > 0 && (
            <section>
              <h2
                className="font-display text-xl font-semibold mb-3"
                style={{ color: 'var(--text)' }}
              >
                En progreso
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
                      style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl leading-none mt-0.5">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold truncate"
                            style={{ color: 'var(--text)' }}
                          >
                            {challenge.name}
                          </p>
                          {challenge.description && (
                            <p
                              className="text-xs mt-0.5 line-clamp-2"
                              style={{ color: 'var(--muted)' }}
                            >
                              {challenge.description}
                            </p>
                          )}
                          <p
                            className="text-xs mt-1"
                            style={{ color: 'var(--muted)' }}
                          >
                            {typeLabel} · Meta: {challenge.goal_value}
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

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span
                            className="text-xs font-medium"
                            style={{ color: 'var(--muted)' }}
                          >
                            {challenge.currentValue} / {challenge.goal_value}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: 'var(--brand-primary-dark)' }}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: 'var(--border)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: 'var(--brand-primary)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Completed challenges */}
          {completedChallenges.length > 0 && (
            <section>
              <h2
                className="font-display text-xl font-semibold mb-3"
                style={{ color: 'var(--text)' }}
              >
                Completados
              </h2>
              <div className="space-y-3">
                {completedChallenges.map((challenge) => {
                  const icon = TYPE_ICONS[challenge.type] ?? '🎯';

                  return (
                    <div
                      key={challenge.id}
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                        opacity: 0.75,
                      }}
                    >
                      <span className="text-2xl leading-none">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold truncate"
                          style={{ color: 'var(--text)' }}
                        >
                          {challenge.name}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--muted)' }}
                        >
                          Completado
                        </p>
                      </div>
                      <div
                        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
                        style={{ background: '#d1fae5' }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#059669"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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
