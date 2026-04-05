import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { cookies } from 'next/headers';

function generateMemberCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'recovery' for password reset
  const redirectTo = searchParams.get('redirect') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  // Create the redirect response FIRST — Supabase cookies must be set on THIS response
  const destination = type === 'recovery' ? '/auth/reset' : redirectTo;
  const response = NextResponse.redirect(new URL(destination, request.url));

  // Supabase client that writes session cookies directly onto the redirect response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Exchange code for session — sets auth cookies on response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionData, error: sessionError } = await (supabase.auth as any).exchangeCodeForSession(code);

  if (sessionError || !sessionData?.user) {
    console.error('Auth callback error:', sessionError);
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }

  // Password reset flow — session is set, redirect to reset page
  if (type === 'recovery') {
    return response;
  }

  const userId = sessionData.user.id;
  const userEmail = sessionData.user.email ?? '';
  const memberName = (sessionData.user.user_metadata?.name as string | undefined)
    ?? userEmail.split('@')[0];

  // Read tenant from cookie
  const cookieStore = await cookies();
  const tenantSlug = cookieStore.get('loyalty_tenant')?.value;

  if (!tenantSlug) {
    return response;
  }

  const serviceClient = createServiceRoleClient();

  // Fetch tenant
  const { data: tenant } = await serviceClient
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .in('plan_status', ['trialing', 'active'])
    .single();

  if (!tenant) {
    return response;
  }

  // 1. Check if already linked
  const { data: linkedMember } = await serviceClient
    .from('members')
    .select('id')
    .eq('auth_user_id', userId)
    .eq('tenant_id', tenant.id)
    .single();

  if (linkedMember) {
    return response; // already linked, nothing to do
  }

  // 2. Try to link by email — member exists but was created via dashboard (auth_user_id = null)
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
    return response;
  }

  // 3. No existing member — auto-create on first registration
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

  const { error: insertError } = await serviceClient.from('members').insert({
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

  if (insertError) {
    console.error('Failed to create member record:', insertError);
  }

  return response;
}
