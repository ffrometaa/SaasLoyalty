import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { getMemberWithTenant } from '@/lib/member/queries';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.redirect(new URL('/join', request.url));
  }

  // Verify the authenticated user actually belongs to this tenant
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
