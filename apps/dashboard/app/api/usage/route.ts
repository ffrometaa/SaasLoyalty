import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createServerSupabaseClient();

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, max_members, plan')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [membersResult, pointsResult] = await Promise.all([
      supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .is('deleted_at', null),
      supabase
        .from('transactions')
        .select('points')
        .eq('tenant_id', tenant.id)
        .in('type', ['earn', 'bonus', 'birthday', 'referral'])
        .gte('created_at', monthStart),
    ]);

    const activeMembers = membersResult.count ?? 0;
    const pointsIssued = (pointsResult.data ?? []).reduce((sum: number, t: { points: number | null }) => sum + (t.points ?? 0), 0);

    return NextResponse.json({
      activeMembers,
      memberLimit: tenant.max_members,
      pointsIssuedThisMonth: pointsIssued,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
