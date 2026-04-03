import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { getTenantForUser } from '../../../../../lib/tenant';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await getTenantForUser(supabase, session.user.id);
    if (!result) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    if (result.role !== 'owner') return NextResponse.json({ error: 'Only owners can revoke invitations' }, { status: 403 });

    const { error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', id)
      .eq('tenant_id', result.tenant.id)
      .eq('status', 'pending');

    if (error) return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
