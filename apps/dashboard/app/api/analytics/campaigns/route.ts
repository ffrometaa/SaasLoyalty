import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

const fetchCampaignsData = unstable_cache(
  async (tenantId: string, from: string, to: string) => {
    const db = createServiceRoleClient();

    const [
      { data: campaigns },
      { data: earnTx },
      { data: redeemTx },
    ] = await Promise.all([
      db.from('campaigns')
        .select('id, name, type, status, bonus_points, bonus_multiplier, stats, started_at, completed_at, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20),
      db.from('transactions')
        .select('points, created_at')
        .eq('tenant_id', tenantId)
        .eq('type', 'earn')
        .gte('created_at', from)
        .lte('created_at', to),
      db.from('transactions')
        .select('points, created_at')
        .eq('tenant_id', tenantId)
        .eq('type', 'redeem')
        .gte('created_at', from)
        .lte('created_at', to),
    ]);

    // Build weekly points timeline anchored from `from`
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const totalMs = toDate.getTime() - fromDate.getTime();
    const weekMs = 7 * 86400000;
    const numWeeks = Math.max(1, Math.ceil(totalMs / weekMs));
    const weeks: { label: string; earned: number; redeemed: number }[] = [];

    for (let i = 0; i < numWeeks; i++) {
      const weekStart = new Date(fromDate.getTime() + i * weekMs);
      const weekEnd = new Date(fromDate.getTime() + (i + 1) * weekMs);
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const earned = (earnTx ?? []).filter((t: { points: number; created_at: string }) => {
        const d = new Date(t.created_at);
        return d >= weekStart && d < weekEnd;
      }).reduce((s: number, t: { points: number }) => s + t.points, 0);

      const redeemed = (redeemTx ?? []).filter((t: { points: number; created_at: string }) => {
        const d = new Date(t.created_at);
        return d >= weekStart && d < weekEnd;
      }).reduce((s: number, t: { points: number }) => s + Math.abs(t.points), 0);

      weeks.push({ label, earned, redeemed });
    }

    return {
      campaigns: (campaigns ?? []).map((c: { id: string; name: string | null; type: string | null; status: string | null; bonus_points: number | null; bonus_multiplier: number | null; stats: unknown; started_at: string | null; completed_at: string | null }) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        bonusPoints: c.bonus_points,
        bonusMultiplier: c.bonus_multiplier,
        stats: c.stats as { sent: number; delivered: number; opened: number; clicked: number },
        startedAt: c.started_at,
        completedAt: c.completed_at,
      })),
      pointsTimeline: weeks,
    };
  },
  ['analytics-campaigns'],
  { revalidate: 300, tags: ['analytics'] },
);

async function resolveTenantId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string): Promise<string | null> {
  const { data: owner } = await supabase
    .from('tenants')
    .select('id')
    .eq('auth_user_id', userId)
    .is('deleted_at', null)
    .single();
  if (owner?.id) return owner.id;

  const { data: staff } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('auth_user_id', userId)
    .single();
  return staff?.tenant_id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createServerSupabaseClient();
    const tenantId = await resolveTenantId(supabase, user.id);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const searchParams = request.nextUrl.searchParams;
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 56 * 86400000).toISOString();
    const defaultTo = now.toISOString();
    const from = searchParams.get('from') ?? defaultFrom;
    const to = searchParams.get('to') ?? defaultTo;

    const data = await fetchCampaignsData(tenantId, from, to);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Campaigns analytics API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
