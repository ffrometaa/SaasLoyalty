import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { getServerUser } from '@/lib/supabase';
import { cookies } from 'next/headers';

function generateMemberCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/auth/link-member
// Called after signUp() when email confirmation is disabled and session is returned immediately.
// Replicates the linking logic from /auth/callback.
export async function POST() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const tenantSlug = cookieStore.get('loyalty_tenant')?.value;
  if (!tenantSlug) {
    return NextResponse.json({ ok: true, note: 'no tenant cookie' });
  }

  const serviceClient = createServiceRoleClient();

  const { data: tenant } = await serviceClient
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .in('plan_status', ['trialing', 'active'])
    .single();

  if (!tenant) {
    return NextResponse.json({ ok: true, note: 'tenant not found' });
  }

  const userId = user.id;
  const userEmail = user.email ?? '';
  const memberName = ((user as any).user_metadata?.name as string | undefined) ?? userEmail.split('@')[0];

  // 1. Already linked?
  const { data: linked } = await serviceClient
    .from('members')
    .select('id')
    .eq('auth_user_id', userId)
    .eq('tenant_id', tenant.id)
    .single();

  if (linked) return NextResponse.json({ ok: true });

  // 2. Link by email (dashboard-created member with auth_user_id = null)
  const { data: emailMember } = await serviceClient
    .from('members')
    .select('id')
    .eq('email', userEmail)
    .eq('tenant_id', tenant.id)
    .is('auth_user_id', null)
    .single();

  if (emailMember) {
    await serviceClient
      .from('members')
      .update({ auth_user_id: userId, name: memberName })
      .eq('id', emailMember.id);
    return NextResponse.json({ ok: true });
  }

  // 3. Auto-create new member
  let memberCode = generateMemberCode();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: existing } = await serviceClient
      .from('members')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('member_code', memberCode)
      .single();
    if (!existing) break;
    memberCode = generateMemberCode();
  }

  await serviceClient.from('members').insert({
    auth_user_id: userId,
    tenant_id: tenant.id,
    email: userEmail,
    name: memberName,
    tier: 'bronze',
    points_balance: 0,
    points_lifetime: 0,
    visits_total: 0,
    member_code: memberCode,
  });

  return NextResponse.json({ ok: true });
}
