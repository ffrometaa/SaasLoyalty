import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase';
import { getMemberWithTenant } from '@/lib/member/queries';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { BottomNav } from '@/components/member/BottomNav';
import { BrandTheme } from '@/components/member/BrandTheme';

interface LeaderboardEntry {
  rank: number;
  memberId: string;
  name: string;
  tier: string;
  points: number;
  delta: number;
}

interface Snapshot {
  entries: LeaderboardEntry[];
  period_key: string;
  period_type: string;
  generated_at: string;
}

async function getLeaderboard(tenantId: string): Promise<Snapshot | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('leaderboard_snapshots')
      .select('entries, period_key, period_type, generated_at')
      .eq('tenant_id', tenantId)
      .eq('period_type', 'month')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data as Snapshot | null;
  } catch {
    return null;
  }
}

const TIER_COLORS: Record<string, string> = {
  bronze: '#b45309',
  silver: '#94a3b8',
  gold: '#f59e0b',
  platinum: '#67e8f9',
};

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default async function LeaderboardPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const member = await getMemberWithTenant(user.id);
  if (!member) redirect('/login');

  const snapshot = await getLeaderboard(member.tenant_id);
  const entries = (snapshot?.entries ?? []) as LeaderboardEntry[];
  const memberEntry = entries.find(e => e.memberId === member.id);

  const periodLabel = snapshot
    ? snapshot.period_type === 'month'
      ? `Mes ${snapshot.period_key}`
      : `Semana ${snapshot.period_key}`
    : '';

  return (
    <>
      <BrandTheme
        primary={member.tenant.brand_color_primary}
        secondary={member.tenant.brand_color_secondary}
      />

      <main className="min-h-screen pb-24" style={{ background: 'var(--cream)' }}>
        {/* Header */}
        <div className="px-5 pt-12 pb-6" style={{ background: 'var(--brand-primary)' }}>
          <h1 className="text-2xl font-bold text-white mb-1">Ranking</h1>
          <p className="text-white/70 text-sm">{periodLabel || 'Clasificación mensual'}</p>
        </div>

        {/* My position sticky card */}
        {memberEntry && (
          <div className="px-5 py-4">
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: 'var(--brand-primary)', color: 'white' }}
            >
              <div className="text-3xl font-black w-12 text-center">
                {RANK_MEDALS[memberEntry.rank] ?? `#${memberEntry.rank}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70">Tu posición</p>
                <p className="text-lg font-bold leading-tight">Puesto #{memberEntry.rank}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black">{memberEntry.points.toLocaleString()}</p>
                <p className="text-xs text-white/70">puntos</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard list */}
        <div className="px-5 pb-6">
          {entries.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🏆</div>
              <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text)' }}>
                Aún no hay ranking
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                El ranking se actualiza semanalmente. ¡Empezá a acumular puntos!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => {
                const isMe = entry.memberId === member.id;
                const medal = RANK_MEDALS[entry.rank];
                const tierColor = TIER_COLORS[entry.tier] ?? '#94a3b8';
                const deltaUp = entry.delta > 0;
                

                return (
                  <div
                    key={entry.memberId}
                    className="rounded-2xl p-3.5 flex items-center gap-3"
                    style={{
                      background: isMe ? 'var(--brand-primary-light, #ede9fe)' : 'white',
                      border: isMe ? '2px solid var(--brand-primary)' : '1px solid var(--border)',
                    }}
                  >
                    {/* Rank */}
                    <div className="w-9 text-center shrink-0">
                      {medal ? (
                        <span className="text-xl">{medal}</span>
                      ) : (
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: 'var(--muted)' }}
                        >
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Tier dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: tierColor }}
                    />

                    {/* Name */}
                    <span
                      className="flex-1 text-sm font-semibold truncate"
                      style={{ color: 'var(--text)' }}
                    >
                      {entry.name}{isMe ? ' (vos)' : ''}
                    </span>

                    {/* Delta */}
                    {entry.delta !== 0 && (
                      <span
                        className="text-[10px] font-semibold shrink-0"
                        style={{ color: deltaUp ? '#059669' : '#dc2626' }}
                      >
                        {deltaUp ? '▲' : '▼'}{Math.abs(entry.delta)}
                      </span>
                    )}

                    {/* Points */}
                    <span
                      className="text-sm font-bold tabular-nums shrink-0"
                      style={{ color: 'var(--text)' }}
                    >
                      {entry.points.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
