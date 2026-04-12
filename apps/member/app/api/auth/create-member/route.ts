/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@loyalty-os/lib/server';

function generateMemberCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function POST(request: NextRequest) {
  const serviceClient = createServiceRoleClient();

  // Prefer Bearer token from Authorization header (avoids cookie race condition
  // when called immediately after signInWithPassword/signUp from the browser).
  // Fall back to cookie-based session for the email confirmation flow (auth/callback).
  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let userId: string;
  let userEmail: string;
  // 
  let meta: Record<string, unknown>;

  if (accessToken) {
    const { data: { user } } = await (serviceClient.auth as any).getUser(accessToken);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    userId = user.id;
    userEmail = user.email ?? '';
    meta = user.user_metadata ?? {};
  } else {
    const supabase = await createServerSupabaseClient();
    // 
    const { data: { user } } = await (supabase.auth as any).getUser();
    if (!user) return NextResponse.json({ error: 'No session' }, { status: 401 });
    userId = user.id;
    userEmail = user.email ?? '';
    meta = user.user_metadata ?? {};
  }

  const body = await request.json().catch(() => ({}));
  const { tenantId, firstName, lastName, phone, birthMonth, birthDay, referralCode } = body as {
    tenantId?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthMonth?: number;
    birthDay?: number;
    referralCode?: string;
  };

  // tenantId can also come from user_metadata (email confirmation flow)
  const resolvedTenantId = tenantId ?? meta.tenant_id;

  if (!resolvedTenantId) {
    return NextResponse.json({ ok: true, note: 'no tenant' });
  }
  const resolvedFirstName = firstName ?? meta.first_name ?? '';
  const resolvedLastName = lastName ?? meta.last_name ?? '';
  const fullName = [resolvedFirstName, resolvedLastName].filter(Boolean).join(' ')
    || meta.name
    || userEmail.split('@')[0];

  // 1. Already linked? (any status — if inactive, reactivate it)
  const { data: linked } = await serviceClient
    .from('members')
    .select('id, status')
    .eq('auth_user_id', userId)
    .eq('tenant_id', resolvedTenantId)
    .single();

  if (linked) {
    if (linked.status !== 'active') {
      await serviceClient.from('members').update({ status: 'active' }).eq('id', linked.id);
    }
    return NextResponse.json({ ok: true });
  }

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

  // 3. Resolve referrer (optional)
  let referredBy: string | null = null;
  if (referralCode) {
    const { data: referrer } = await serviceClient
      .from('members')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .eq('tenant_id', resolvedTenantId)
      .eq('status', 'active')
      .single();
    referredBy = referrer?.id ?? null;
  }

  // 4. Fetch tenant to check welcome bonus
  const { data: tenantConfig } = await serviceClient
    .from('tenants')
    .select('welcome_bonus_enabled, welcome_bonus_points')
    .eq('id', resolvedTenantId)
    .single();

  const welcomeBonus = tenantConfig?.welcome_bonus_enabled ? (tenantConfig.welcome_bonus_points ?? 50) : 0;

  // 5. Create new member
  let memberCode = generateMemberCode();
  for (let i = 0; i < 3; i++) {
    const { data: existing } = await serviceClient
      .from('members').select('id')
      .eq('tenant_id', resolvedTenantId).eq('member_code', memberCode).single();
    if (!existing) break;
    memberCode = generateMemberCode();
  }

  const { error: insertError } = await serviceClient.from('members').insert({
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
    ...(referredBy ? { referred_by: referredBy } : {}),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Apply welcome bonus if configured
  if (welcomeBonus > 0) {
    const { data: newMember } = await serviceClient
      .from('members')
      .select('id')
      .eq('auth_user_id', userId)
      .eq('tenant_id', resolvedTenantId)
      .single();

    if (newMember) {
      await serviceClient.from('transactions').insert({
        tenant_id: resolvedTenantId,
        member_id: newMember.id,
        type: 'bonus',
        points: welcomeBonus,
        balance_after: welcomeBonus,
        description: 'Welcome bonus',
      });
      await serviceClient.from('members').update({
        points_balance: welcomeBonus,
        points_lifetime: welcomeBonus,
      }).eq('id', newMember.id);
    }
  }

  return NextResponse.json({ ok: true });
}
