import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/auth/registration-complete',
    '/pricing',
    '/features',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // API routes that need special handling
  const isApiRoute = pathname.startsWith('/api');

  // Get the current session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { session } } = await (supabase.auth as any).getSession();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/settings', '/members', '/rewards', '/campaigns', '/analytics'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Auth routes (redirect if already logged in)
  const authRoutes = ['/login', '/register', '/forgot-password'];
  const isAuthRoute = authRoutes.includes(pathname);

  // Redirect authenticated users away from auth pages
  if (session && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to login
  if (!session && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Set tenant context for RLS from subdomain
  const hostname = request.headers.get('hostname') || '';
  const parts = hostname.split('.');
  
  // If we have a subdomain (e.g., serenity-spa.loyaltyos.com)
  if (parts.length >= 3 && !['www', 'app', 'dashboard'].includes(parts[0])) {
    const subdomain = parts[0];
    // Set tenant slug for the request
    supabaseResponse.headers.set('x-tenant-slug', subdomain);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
