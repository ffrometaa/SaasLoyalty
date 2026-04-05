import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_user_id', session.user.id)
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

    const formattedRedemptions = (redemptions || []).map((r: any) => ({
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
