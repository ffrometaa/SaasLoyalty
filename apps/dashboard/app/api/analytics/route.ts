import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

const fetchAnalyticsData = unstable_cache(
  async (tenantId: string) => {
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
      .select('visits_total, status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const segments = { frequent: 0, regular: 0, occasional: 0, atRisk: 0, inactive: 0 };
    for (const m of allMembers || []) {
      if (m.status !== 'active') { segments.inactive++; continue; }
      if (m.visits_total >= 10) segments.frequent++;
      else if (m.visits_total >= 5) segments.regular++;
      else if (m.visits_total >= 2) segments.occasional++;
      else segments.atRisk++;
    }

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
        },
      },
      segments,
      heatmap,
      topRewards,
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

    const data = await fetchAnalyticsData(tenantId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
