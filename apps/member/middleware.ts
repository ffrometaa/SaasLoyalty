import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that never require auth
const PUBLIC_PATHS = [
  '/join',
  '/login',
  '/register',
  '/forgot-password',
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

  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return response;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { session } } = await (supabase.auth as any).getSession();

  if (!session) {
    // Preserve tenant slug from cookie so login page has context
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
