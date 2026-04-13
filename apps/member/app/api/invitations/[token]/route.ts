import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { getInvitationTokenRatelimit } from '@/lib/ratelimit';

// GET /api/invitations/[token] — Returns invitation details for pre-filling registration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const invitationTokenLimiter = getInvitationTokenRatelimit();
  if (invitationTokenLimiter) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ?? '127.0.0.1';
    const { success, limit, reset } = await invitationTokenLimiter.limit(ip);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json({ error: 'Too many requests' }, {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(reset),
        },
      });
    }
  }
  const { token } = await params;

  const serviceClient = createServiceRoleClient();

  const { data: invitation, error } = await serviceClient
    .from('member_invitations')
    .select('id, email, name, expires_at, accepted_at, tenant_id')
    .eq('token', token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  if (invitation.accepted_at) {
    return NextResponse.json({ error: 'Invitation already used' }, { status: 410 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
  }

  // Fetch the tenant's join_code and branding so registration page can show business preview
  const { data: tenant } = await serviceClient
    .from('tenants')
    .select('join_code, business_name, brand_logo_url, brand_color_primary, slug')
    .eq('id', invitation.tenant_id)
    .single();

  return NextResponse.json({
    email: invitation.email,
    name: invitation.name,
    joinCode: tenant?.join_code ?? null,
    businessName: tenant?.business_name ?? null,
    logoUrl: tenant?.brand_logo_url ?? null,
    brandColor: tenant?.brand_color_primary ?? null,
    tenantSlug: tenant?.slug ?? null,
  });
}
