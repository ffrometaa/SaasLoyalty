import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabase';

export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const { data: redemptions } = await supabase
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
