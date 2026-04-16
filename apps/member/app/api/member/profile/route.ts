import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = (await cookies()).get('loyalty_tenant_id')?.value;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

    const { name } = await request.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Service role required: profile update — bypasses RLS for member-scoped write
    const service = createServiceRoleClient();
    const { error } = await service
      .from('members')
      .update({ name: name.trim() })
      .eq('auth_user_id', user.id)
      .eq('tenant_id', tenantId);

    if (error) return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
