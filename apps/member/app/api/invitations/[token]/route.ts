import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

// GET /api/invitations/[token] — Returns invitation details for pre-filling registration
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
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
