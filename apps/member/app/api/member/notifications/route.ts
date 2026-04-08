import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient, getServerUser } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await getServerUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceRoleClient();

    const { data: member } = await db
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const url = new URL(request.url);
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20'));
    const cursor = url.searchParams.get('cursor'); // created_at ISO string for pagination

    let query = db
      .from('notifications')
      .select('id, type, title, content, data, read_at, created_at')
      .eq('member_id', member.id)
      .eq('channel', 'in_app')
      .order('created_at', { ascending: false })
      .limit(limit + 1); // fetch one extra to detect hasMore

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: notifications, error } = await query;
    if (error) throw error;

    const hasMore = (notifications ?? []).length > limit;
    const items = hasMore ? (notifications ?? []).slice(0, limit) : (notifications ?? []);

    // Unread count (separate query, fast via index)
    const { count: unreadCount } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', member.id)
      .eq('channel', 'in_app')
      .is('read_at', null);

    return NextResponse.json({
      notifications: items,
      unreadCount: unreadCount ?? 0,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.created_at : null,
    });
  } catch (err) {
    console.error('Notifications GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
