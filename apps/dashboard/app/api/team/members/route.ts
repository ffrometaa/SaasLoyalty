import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';
import { getTenantForUser } from '../../../../lib/tenant';

export async function GET() {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = await createServerSupabaseClient();

    const result = await getTenantForUser(supabase, user.id);
    if (!result) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Owner entry (always first)
    const ownerEntry = {
      id: `owner-${result.tenant.auth_user_id}`,
      authUserId: result.tenant.auth_user_id,
      email: result.role === 'owner' ? user.email : null,
      role: 'owner' as const,
      joinedAt: result.tenant.created_at,
      isCurrentUser: result.role === 'owner',
      canRemove: false,
    };

    // Staff members
    const { data: staffRows } = await supabase
      .from('tenant_users')
      .select('id, auth_user_id, email, role, created_at')
      .eq('tenant_id', result.tenant.id)
      .order('created_at', { ascending: true });

    const staffEntries = (staffRows ?? []).map((row: any) => ({
      id: row.id,
      authUserId: row.auth_user_id,
      email: row.email,
      role: row.role as 'staff',
      joinedAt: row.created_at,
      isCurrentUser: row.auth_user_id === session.user.id,
      canRemove: result.role === 'owner' && row.auth_user_id !== session.user.id,
    }));

    return NextResponse.json({ members: [ownerEntry, ...staffEntries] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
