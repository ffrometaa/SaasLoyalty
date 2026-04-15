import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');

  if (!code) {
    return NextResponse.redirect(new URL('/join?error=missing_code', request.url));
  }

  const destination = type === 'recovery' ? '/auth/reset' : '/';
  const response = NextResponse.redirect(new URL(destination, request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionData, error: sessionError } = await (supabase.auth as any).exchangeCodeForSession(code);

  if (sessionError || !sessionData?.user) {
    return NextResponse.redirect(new URL('/join?error=auth_failed', request.url));
  }

  // Password reset — session set, redirect to reset page
  if (type === 'recovery') {
    return response;
  }

  // Email confirmation flow — create member using tenant_id from user metadata
  const tenantId = sessionData.user.user_metadata?.tenant_id as string | undefined;
  if (tenantId) {
    const origin = new URL(request.url).origin;
    const memberRes = await fetch(`${origin}/api/auth/create-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
      body: JSON.stringify({ tenantId }),
    });

    if (!memberRes.ok) {
      return NextResponse.redirect(new URL('/join?error=profile_failed', request.url));
    }

    // Redirect through set-tenant to write the httpOnly loyalty_tenant_id cookie
    return NextResponse.redirect(new URL(`/api/auth/set-tenant?tenantId=${tenantId}`, request.url));
  }

  return response;
}
