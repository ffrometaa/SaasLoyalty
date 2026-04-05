import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@loyalty-os/lib/server';

function generateMemberCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { session } } = await (supabase.auth as any).getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { tenantId, firstName, lastName, phone, birthMonth, birthDay } = body as {
    tenantId?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthMonth?: number;
    birthDay?: number;
  };

  // tenantId can also come from user_metadata (email confirmation flow)
  const resolvedTenantId = tenantId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?? (session.user as any).user_metadata?.tenant_id;

  if (!resolvedTenantId) {
    return NextResponse.json({ ok: true, note: 'no tenant' });
  }

  const userId = session.user.id;
  const userEmail = session.user.email ?? '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (session.user as any).user_metadata ?? {};
  const resolvedFirstName = firstName ?? meta.first_name ?? '';
  const resolvedLastName = lastName ?? meta.last_name ?? '';
  const fullName = [resolvedFirstName, resolvedLastName].filter(Boolean).join(' ')
    || meta.name
    || userEmail.split('@')[0];

  const serviceClient = createServiceRoleClient();

  // 1. Already linked?
  const { data: linked } = await serviceClient
    .from('members')
    .select('id')
    .eq('auth_user_id', userId)
    .eq('tenant_id', resolvedTenantId)
    .single();

  if (linked) return NextResponse.json({ ok: true });

  // 2. Link by email (dashboard-created member with auth_user_id = null)
  const { data: emailMember } = await serviceClient
    .from('members')
    .select('id')
    .eq('email', userEmail)
    .eq('tenant_id', resolvedTenantId)
    .is('auth_user_id', null)
    .single();

  if (emailMember) {
    await serviceClient.from('members').update({
      auth_user_id: userId,
      name: fullName,
      first_name: resolvedFirstName || null,
      last_name: resolvedLastName || null,
      phone: phone ?? null,
      birth_month: birthMonth ?? null,
      birth_day: birthDay ?? null,
      status: 'active',
    }).eq('id', emailMember.id);
    return NextResponse.json({ ok: true });
  }

  // 3. Create new member
  let memberCode = generateMemberCode();
  for (let i = 0; i < 3; i++) {
    const { data: existing } = await serviceClient
      .from('members').select('id')
      .eq('tenant_id', resolvedTenantId).eq('member_code', memberCode).single();
    if (!existing) break;
    memberCode = generateMemberCode();
  }

  await serviceClient.from('members').insert({
    auth_user_id: userId,
    tenant_id: resolvedTenantId,
    email: userEmail,
    name: fullName,
    first_name: resolvedFirstName || null,
    last_name: resolvedLastName || null,
    phone: phone ?? null,
    birth_month: birthMonth ?? null,
    birth_day: birthDay ?? null,
    status: 'active',
    tier: 'bronze',
    points_balance: 0,
    points_lifetime: 0,
    visits_total: 0,
    member_code: memberCode,
  });

  return NextResponse.json({ ok: true });
}
