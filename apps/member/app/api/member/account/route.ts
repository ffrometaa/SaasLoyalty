import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { cookies } from 'next/headers';

export async function DELETE(): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = (await cookies()).get('loyalty_tenant_id')?.value;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

    // Service role required: soft-delete member account — bypasses RLS
    const service = createServiceRoleClient();

    // Soft-delete the member record
    const { error: updateError } = await service
      .from('members')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('auth_user_id', user.id)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('[account] update error:', updateError);
      return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
