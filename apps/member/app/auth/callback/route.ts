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
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
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
  const tenantId = sessionData.user.user_metadata?.tenant_id;
  if (tenantId) {
    const origin = new URL(request.url).origin;
    // Fire-and-forget — don't block the redirect
    fetch(`${origin}/api/auth/create-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({ tenantId }),
    }).catch(() => {});
  }

  return response;
}
