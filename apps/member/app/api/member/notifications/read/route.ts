import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient, getServerUser } from '@/lib/supabase';

// POST /api/member/notifications/read
// Body: { ids?: string[] }  — omit ids to mark ALL as read
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = cookies().get('loyalty_tenant_id')?.value;
    const db = createServiceRoleClient();

    let memberQuery = db
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('status', 'active');

    if (tenantId) memberQuery = memberQuery.eq('tenant_id', tenantId);

    const { data: member } = await memberQuery.limit(1).maybeSingle();

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;

    let query = db
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('member_id', member.id)
      .eq('channel', 'in_app')
      .is('read_at', null);

    if (ids && ids.length > 0) {
      query = query.in('id', ids);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Notifications read error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
