import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { getMemberWithTenant } from '@/lib/member/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.redirect(new URL('/join', request.url));
  }

  // Verify the authenticated user actually belongs to this tenant
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/join', request.url));
  }

  const member = await getMemberWithTenant(user.id, tenantId);

  if (!member) {
    // tenantId was manipulated or user has no active membership there
    return NextResponse.redirect(new URL('/join', request.url));
  }

  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set('loyalty_tenant_id', tenantId, {
    path: '/',
    maxAge: 2592000,
    httpOnly: false,
    sameSite: 'lax',
  });
  return response;
}
