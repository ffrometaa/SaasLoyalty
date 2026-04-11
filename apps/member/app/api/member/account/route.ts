import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { cookies } from 'next/headers';

export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { user } } = await (supabase.auth as any).getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = cookies().get('loyalty_tenant_id')?.value;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

    const service = createServiceRoleClient();

    // Soft-delete the member record
    await service
      .from('members')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('auth_user_id', user.id)
      .eq('tenant_id', tenantId);

    // Sign out
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
