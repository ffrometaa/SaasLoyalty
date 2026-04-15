import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient, getServerUser } from '@/lib/supabase';

export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = (await cookies()).get('loyalty_tenant_id')?.value;
    const db = createServiceRoleClient();

    let memberQuery = db
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('status', 'active');

    if (tenantId) memberQuery = memberQuery.eq('tenant_id', tenantId);

    const { data: member } = await memberQuery.limit(1).maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const { data: redemptions } = await db
      .from('redemptions')
      .select(`
        id,
        status,
        alphanumeric_code,
        expires_at,
        used_at,
        rewards (
          name
        )
      `)
      .eq('member_id', member.id)
      .in('status', ['pending', 'used'])
      .order('created_at', { ascending: false });

    type RedemptionRow = {
      id: string;
      status: string;
      alphanumeric_code: string | null;
      expires_at: string | null;
      used_at: string | null;
      rewards: { name: string } | null;
    };

    const formattedRedemptions = (redemptions || []).map((r: RedemptionRow) => ({
      id: r.id,
      reward_name: r.rewards?.name || 'Reward',
      status: r.status,
      alphanumeric_code: r.alphanumeric_code,
      expires_at: r.expires_at,
      used_at: r.used_at,
    }));

    return NextResponse.json({ redemptions: formattedRedemptions });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
