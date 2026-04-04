import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  name: string;
  tier: string;
  points: number;
  delta: number;     // rank change vs previous snapshot (positive = improved)
}

export interface LeaderboardSnapshot {
  tenantId: string;
  periodKey: string;
  periodType: 'month' | 'week';
  entries: LeaderboardEntry[];
  generatedAt: string;
}

function getCurrentPeriodKey(type: 'month' | 'week'): string {
  const now = new Date();
  if (type === 'month') {
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  // ISO week number
  const jan1 = new Date(now.getUTCFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - jan1.getTime()) / 86400000 + jan1.getUTCDay() + 1) / 7
  );
  return `${now.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Generate and persist a leaderboard snapshot for a tenant.
 * Ranks members by points_lifetime for the current period.
 */
export async function generateLeaderboardSnapshot(
  tenantId = '',
  periodType: 'month' | 'week' = 'month'
): Promise<LeaderboardSnapshot> {
  const supabase = await createServerSupabaseClient();
  const periodKey = getCurrentPeriodKey(periodType);

  // Fetch previous snapshot to compute deltas
  const { data: prevSnap } = await supabase
    .from('leaderboard_snapshots')
    .select('entries')
    .eq('tenant_id', tenantId)
    .eq('period_type', periodType)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevEntries = (prevSnap?.entries ?? []) as LeaderboardEntry[];
  const prevRankMap: Record<string, number> = {};
  for (const e of prevEntries) prevRankMap[e.memberId] = e.rank;

  // Fetch active members ranked by lifetime points
  const { data: members } = await supabase
    .from('members')
    .select('id, name, tier, points_lifetime')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('points_lifetime', { ascending: false })
    .limit(100);

  interface MemberRow { id: string; name: string | null; tier: string | null; points_lifetime: number | null }
  const entries: LeaderboardEntry[] = (members ?? []).map((m: MemberRow, i: number) => {
    const rank = i + 1;
    const prev = prevRankMap[m.id];
    const delta = prev != null ? prev - rank : 0; // positive = moved up
    return {
      rank,
      memberId: m.id,
      name: m.name ?? 'Member',
      tier: m.tier ?? 'bronze',
      points: m.points_lifetime ?? 0,
      delta,
    };
  });

  // Upsert snapshot
  await supabase.from('leaderboard_snapshots').upsert(
    {
      tenant_id: tenantId,
      period_key: periodKey,
      period_type: periodType,
      entries,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id,period_key,period_type' }
  );

  return {
    tenantId,
    periodKey,
    periodType,
    entries,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Fetch the most recent leaderboard snapshot for a tenant.
 */
export async function getLatestLeaderboard(
  tenantId = '',
  periodType: 'month' | 'week' = 'month'
): Promise<LeaderboardSnapshot | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('leaderboard_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('period_type', periodType)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    tenantId: data.tenant_id,
    periodKey: data.period_key,
    periodType: data.period_type,
    entries: data.entries as LeaderboardEntry[],
    generatedAt: data.generated_at,
  };
}

/**
 * Fetch a member's position in the most recent snapshot.
 * Returns null if the member is not in the leaderboard.
 */
export async function getMemberLeaderboardPosition(
  tenantId = '',
  memberId = '',
  periodType: 'month' | 'week' = 'month'
): Promise<LeaderboardEntry | null> {
  const snapshot = await getLatestLeaderboard(tenantId, periodType);
  if (!snapshot) return null;
  return snapshot.entries.find(e => e.memberId === memberId) ?? null;
}
