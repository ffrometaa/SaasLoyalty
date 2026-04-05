import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/offline',
  '/manifest.json',
  '/sw.js',
  '/workbox',
  '/icons',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check public paths FIRST — no Supabase client created, no session check, no redirect ever
  if (isPublic(pathname)) {
    return NextResponse.next({ request });
  }

  // Protected path — create client and check session
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) {
    // No session — redirect to login, preserving tenant context
    const tenantSlug = request.cookies.get('loyalty_tenant')?.value;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = tenantSlug ? `/join/${tenantSlug}` : '/login';
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
