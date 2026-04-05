import { NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@loyalty-os/lib/server';
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
  // Use getSession() (cookie read, no network call) — more reliable than getUser()
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { session } } = await (supabase.auth as any).getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }
  const user = session.user;

  const cookieStore = await cookies();
  const tenantSlug = cookieStore.get('loyalty_tenant')?.value;
  const joinCode = cookieStore.get('loyalty_join_code')?.value;

  if (!tenantSlug && !joinCode) {
    return NextResponse.json({ ok: true, note: 'no tenant cookie' });
  }

  const serviceClient = createServiceRoleClient();

  // Resolve tenant: prefer join_code (newer flow), fall back to slug
  let tenant: { id: string } | null = null;

  if (joinCode) {
    const { data } = await serviceClient
      .from('tenants')
      .select('id')
      .eq('join_code', joinCode.trim().toUpperCase())
      .in('plan_status', ['trialing', 'active'])
      .single();
    tenant = data ?? null;
  }

  if (!tenant && tenantSlug) {
    const { data } = await serviceClient
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .in('plan_status', ['trialing', 'active'])
      .single();
    tenant = data ?? null;
  }

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
      .update({ auth_user_id: userId, name: memberName, status: 'active' })
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
    status: 'active',
    tier: 'bronze',
    points_balance: 0,
    points_lifetime: 0,
    visits_total: 0,
    member_code: memberCode,
  });

  return NextResponse.json({ ok: true });
}
