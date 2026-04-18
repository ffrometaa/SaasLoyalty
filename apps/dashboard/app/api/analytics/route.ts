import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

const fetchAnalyticsData = unstable_cache(
  async (tenantId: string, from: string, to: string) => {
    const db = createServiceRoleClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Active members count
    const { count: activeMembers } = await db
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    // Visits this month
    const { count: visitsThisMonth } = await db
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth.toISOString());

    // Visits last month (for comparison)
    const { count: visitsLastMonth } = await db
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfLastMonth.toISOString())
      .lte('created_at', endOfLastMonth.toISOString());

    // Points redeemed this month
    const { data: redemptionsThisMonth } = await db
      .from('transactions')
      .select('points')
      .eq('tenant_id', tenantId)
      .eq('type', 'redeem')
      .gte('created_at', startOfMonth.toISOString());

    const pointsRedeemedThisMonth = redemptionsThisMonth?.reduce((sum: number, t: { points: number }) => sum + Math.abs(t.points), 0) || 0;

    // Points redeemed last month
    const { data: redemptionsLastMonth } = await db
      .from('transactions')
      .select('points')
      .eq('tenant_id', tenantId)
      .eq('type', 'redeem')
      .gte('created_at', startOfLastMonth.toISOString())
      .lte('created_at', endOfLastMonth.toISOString());

    const pointsRedeemedLastMonth = redemptionsLastMonth?.reduce((sum: number, t: { points: number }) => sum + Math.abs(t.points), 0) || 0;

    // Retention rate (active / total members ever created)
    const { count: totalMembersEver } = await db
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const retentionRate = totalMembersEver ? Math.round(((activeMembers || 0) / totalMembersEver) * 100) : 0;

    // Calculate changes
    const visitsChange = visitsLastMonth
      ? Math.round(((visitsThisMonth || 0) - visitsLastMonth) / visitsLastMonth * 100)
      : 0;

    const pointsChange = pointsRedeemedLastMonth
      ? Math.round((pointsRedeemedThisMonth - pointsRedeemedLastMonth) / pointsRedeemedLastMonth * 100)
      : 0;

    // Member segments by visit frequency
    const { data: allMembers } = await db
      .from('members')
      .select('visits_total, status, points_balance')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .returns<{ visits_total: number | null; status: string; points_balance: number | null }[]>();

    const segments = { frequent: 0, regular: 0, occasional: 0, atRisk: 0, inactive: 0 };
    for (const m of allMembers || []) {
      if (m.status !== 'active') { segments.inactive++; continue; }
      if (m.visits_total >= 10) segments.frequent++;
      else if (m.visits_total >= 5) segments.regular++;
      else if (m.visits_total >= 2) segments.occasional++;
      else segments.atRisk++;
    }

    // Tier distribution — reuse allMembers
    const tier_distribution = [
      { tier: 'bronze',   count: allMembers?.filter(m => (m.visits_total ?? 0) < 5).length ?? 0 },
      { tier: 'silver',   count: allMembers?.filter(m => (m.visits_total ?? 0) >= 5 && (m.visits_total ?? 0) < 15).length ?? 0 },
      { tier: 'gold',     count: allMembers?.filter(m => (m.visits_total ?? 0) >= 15 && (m.visits_total ?? 0) < 30).length ?? 0 },
      { tier: 'platinum', count: allMembers?.filter(m => (m.visits_total ?? 0) >= 30).length ?? 0 },
    ];

    // Points liability (active members with balance)
    const points_liability = allMembers
      ?.filter(m => m.status === 'active')
      .reduce((s, m) => s + (m.points_balance ?? 0), 0) ?? 0;

    // Visits heatmap (day_of_week x hour_of_day — precomputed in visits table)
    const { data: visitData } = await db
      .from('visits')
      .select('day_of_week, hour_of_day')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth.toISOString());

    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const v of visitData || []) {
      if (v.day_of_week !== null && v.hour_of_day !== null) {
        heatmap[v.day_of_week][v.hour_of_day]++;
      }
    }

    // Top rewards redeemed
    const { data: rewardRedemptions } = await db
      .from('redemptions')
      .select('reward_id, rewards(name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'used');

    const rewardCounts: Record<string, { name: string; count: number }> = {};
    for (const r of rewardRedemptions || []) {
      const reward = r.rewards as { name: string } | null;
      if (reward && r.reward_id) {
        if (!rewardCounts[r.reward_id]) {
          rewardCounts[r.reward_id] = { name: reward.name, count: 0 };
        }
        rewardCounts[r.reward_id].count++;
      }
    }
    const topRewards = Object.values(rewardCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Revenue this period
    const { data: visitsWithAmount } = await db
      .from('visits')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('created_at', from)
      .lte('created_at', to)
      .not('amount', 'is', null);
    const revenue_this_month = visitsWithAmount?.reduce((s, v) => s + (v.amount ?? 0), 0) ?? 0;

    // Revenue last period (mirror from/to but shifted back by same duration)
    const durationMs = new Date(to).getTime() - new Date(from).getTime();
    const lastFrom = new Date(new Date(from).getTime() - durationMs).toISOString();
    const lastTo = from;
    const { data: lastVisitsWithAmount } = await db
      .from('visits')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('created_at', lastFrom)
      .lte('created_at', lastTo)
      .not('amount', 'is', null);
    const revenue_last_month = lastVisitsWithAmount?.reduce((s, v) => s + (v.amount ?? 0), 0) ?? 0;
    const revenue_change = revenue_last_month === 0
      ? 0
      : Math.round(((revenue_this_month - revenue_last_month) / revenue_last_month) * 100);

    // New members monthly (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    const { data: newMembersRaw } = await db
      .from('members')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', twelveMonthsAgo.toISOString());
    // Group by month in JS
    const monthlyMap = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(twelveMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap.set(key, 0);
    }
    for (const m of (newMembersRaw ?? [])) {
      const key = new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
    }
    const new_members_monthly = Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count }));

    return {
      metrics: {
        activeMembers: activeMembers || 0,
        visitsThisMonth: visitsThisMonth || 0,
        pointsRedeemedThisMonth,
        retentionRate,
        changes: {
          activeMembers: 0,
          visitsThisMonth: visitsChange,
          pointsRedeemedThisMonth: pointsChange,
          retentionRate: 0,
          revenue: revenue_change,
        },
      },
      segments,
      heatmap,
      topRewards,
      revenue_this_month,
      revenue_last_month,
      revenue_change,
      points_liability,
      new_members_monthly,
      tier_distribution,
    };
  },
  ['analytics'],
  { revalidate: 300, tags: ['analytics'] },
);

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Resolve tenant — works for both owners and staff
    const { data: ownerTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    let tenantId: string | null = ownerTenant?.id ?? null;

    if (!tenantId) {
      const { data: staffRecord } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      tenantId = staffRecord?.tenant_id ?? null;
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Parse date range params
    const searchParams = request.nextUrl.searchParams;
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultTo = now.toISOString();
    const from = searchParams.get('from') ?? defaultFrom;
    const to = searchParams.get('to') ?? defaultTo;

    const data = await fetchAnalyticsData(tenantId, from, to);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
