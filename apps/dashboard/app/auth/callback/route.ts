import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    // No PKCE code — token may be in the hash fragment (magic link / implicit flow).
    // The browser will carry the hash when following this redirect.
    return NextResponse.redirect(`${origin}/auth/recovery`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! /* Required: must be defined in all environments — validated at startup */,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! /* Required: must be defined in all environments — validated at startup */,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }); },
        remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: '', ...options }); },
      },
    }
  );

  interface AuthWithExchange {
    exchangeCodeForSession(code: string): Promise<{ error: Error | null }>;
  }
  const { error } = await (supabase.auth as unknown as AuthWithExchange).exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return response;
}
