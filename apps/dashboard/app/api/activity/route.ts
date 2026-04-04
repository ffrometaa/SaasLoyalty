import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: ownerTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .is('deleted_at', null)
      .single();

    let tenantId: string | null = ownerTenant?.id ?? null;

    if (!tenantId) {
      const { data: staffRecord } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('auth_user_id', session.user.id)
        .single();
      tenantId = staffRecord?.tenant_id ?? null;
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Recent transactions (earn/redeem)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, type, points, created_at, member_id, members(name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Recent new members
    const { data: newMembers } = await supabase
      .from('members')
      .select('id, name, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    // Merge and sort by date, take top 10
    type ActivityItem = {
      id: string;
      type: 'earn' | 'redeem' | 'new_member';
      memberName: string;
      points?: number;
      createdAt: string;
    };

    const activity: ActivityItem[] = [];

    for (const t of transactions || []) {
      const member = t.members as { name: string } | null;
      activity.push({
        id: `txn-${t.id}`,
        type: t.type === 'redeem' ? 'redeem' : 'earn',
        memberName: member?.name ?? 'Unknown member',
        points: Math.abs(t.points),
        createdAt: t.created_at,
      });
    }

    for (const m of newMembers || []) {
      activity.push({
        id: `member-${m.id}`,
        type: 'new_member',
        memberName: m.name,
        createdAt: m.created_at,
      });
    }

    activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ activity: activity.slice(0, 10) });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
