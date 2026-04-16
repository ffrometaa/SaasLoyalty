import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthRatelimit, isRateLimitedPath } from './lib/ratelimit';

// MIDDLEWARE RULES — DO NOT REMOVE
// 1. Public paths are never redirected regardless of auth state.
//    Add new public paths to the PUBLIC_PATHS array below.
// 2. Middleware only checks authentication (session cookie).
//    It never checks member profile existence.
//    Profile checks belong in page components.
// 3. Never redirect to login from middleware if the user has a valid session.
//    Redirect to profile completion instead if profile is missing.

const PUBLIC_PATHS = [
  '/join',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/api/auth',
  '/api/invitations',
  '/impersonate',
  '/offline',
  '/manifest.json',
  '/sw.js',
  '/workbox',
  '/icons',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Rate limiting — apply to auth endpoints before any session check
  if (isRateLimitedPath(pathname)) {
    const ratelimit = getAuthRatelimit();
    if (ratelimit) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        '127.0.0.1';

      const { success, limit, reset } = await ratelimit.limit(ip);

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        });
      }
    }
  }

  // Check public paths FIRST — no Supabase client created, no session check, no redirect ever
  if (isPublic(pathname)) {
    return NextResponse.next({ request });
  }

  // Protected path — create client and check session
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! /* Required: must be defined in all environments — validated at startup */,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! /* Required: must be defined in all environments — validated at startup */,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // No session — redirect to join, preserving tenant context
    const loginUrl = request.nextUrl.clone();
    // In member app, we use /join, not /login. We don't have [tenantSlug] dynamic route, so we just redirect to /join
    loginUrl.pathname = '/join';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
