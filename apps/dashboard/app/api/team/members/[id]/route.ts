import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';
import { getTenantForUser } from '../../../../../lib/tenant';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = await createServerSupabaseClient();

    const result = await getTenantForUser(supabase, user.id);
    if (!result) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    if (result.role !== 'owner') return NextResponse.json({ error: 'Only owners can remove team members' }, { status: 403 });

    const { error } = await supabase
      .from('tenant_users')
      .delete()
      .eq('id', id)
      .eq('tenant_id', result.tenant.id);

    if (error) return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
