import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Public routes — no session required
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/invite') ||
    pathname.startsWith('/admin/preview') ||
    pathname.startsWith('/consent') ||
    pathname.startsWith('/api/tenant/consent')
  ) {
    return supabaseResponse;
  }

  const { data: { user } } = await (supabase.auth as any).getUser();

  // Unauthenticated users: redirect to login for all protected routes
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // /admin routes: super_admin role verification is enforced server-side in
  // app/admin/layout.tsx via verifyAdminAccess() which redirects to /login
  // if the user is not an active super admin.
  if (pathname.startsWith('/admin')) {
    return supabaseResponse;
  }

  // Authorization: verify user is a tenant owner or staff member.
  // Regular members (loyalty program users) must NOT access the dashboard.
  const { data: ownerTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (!ownerTenant) {
    const { data: staffRecord } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!staffRecord) {
      // User is authenticated but is NOT a tenant owner or staff — block access
      const memberAppUrl = process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? 'https://member.loyalbase.dev';
      return NextResponse.redirect(memberAppUrl);
    }
  }

  // DPA gate: tenant owners must accept the Data Processing Agreement before accessing the dashboard.
  // Staff members are not gated — the legal obligation falls on the tenant owner.
  if (ownerTenant) {
    const { data: dpaConsent } = await supabase
      .from('tenant_consents')
      .select('id')
      .eq('tenant_id', ownerTenant.id)
      .eq('document_id', '00000000-0000-0000-0000-000000000003')
      .maybeSingle();

    if (!dpaConsent) {
      const url = request.nextUrl.clone();
      url.pathname = '/consent';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
