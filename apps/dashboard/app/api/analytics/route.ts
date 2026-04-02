import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 401 }
      );
    }

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Active members count
    const { count: activeMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    // Visits this month
    const { count: visitsThisMonth } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth.toISOString());

    // Visits last month (for comparison)
    const { count: visitsLastMonth } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfLastMonth.toISOString())
      .lte('created_at', endOfLastMonth.toISOString());

    // Points redeemed this month
    const { data: redemptionsThisMonth } = await supabase
      .from('transactions')
      .select('points')
      .eq('tenant_id', tenantId)
      .eq('type', 'redeem')
      .gte('created_at', startOfMonth.toISOString());

    const pointsRedeemedThisMonth = redemptionsThisMonth?.reduce((sum: number, t: { points: number }) => sum + Math.abs(t.points), 0) || 0;

    // Points redeemed last month
    const { data: redemptionsLastMonth } = await supabase
      .from('transactions')
      .select('points')
      .eq('tenant_id', tenantId)
      .eq('type', 'redeem')
      .gte('created_at', startOfLastMonth.toISOString())
      .lte('created_at', endOfLastMonth.toISOString());

    const pointsRedeemedLastMonth = redemptionsLastMonth?.reduce((sum: number, t: { points: number }) => sum + Math.abs(t.points), 0) || 0;

    // Retention rate (active / total members ever created)
    const { count: totalMembersEver } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const retentionRate = totalMembersEver ? Math.round(((activeMembers || 0) / totalMembersEver) * 100) : 0;

    // Calculate changes
    const visitsChange = visitsLastMonth ? 
      Math.round(((visitsThisMonth || 0) - visitsLastMonth) / visitsLastMonth * 100) : 0;
    
    const pointsChange = pointsRedeemedLastMonth ? 
      Math.round((pointsRedeemedThisMonth - pointsRedeemedLastMonth) / pointsRedeemedLastMonth * 100) : 0;

    return NextResponse.json({
      metrics: {
        activeMembers: activeMembers || 0,
        visitsThisMonth: visitsThisMonth || 0,
        pointsRedeemedThisMonth,
        retentionRate,
        changes: {
          activeMembers: 12, // TODO: Calculate actual change
          visitsThisMonth: visitsChange,
          pointsRedeemedThisMonth: pointsChange,
          retentionRate: 5, // TODO: Calculate actual change
        }
      }
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
