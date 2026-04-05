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
    .select('id, email, name, expires_at, accepted_at')
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

  return NextResponse.json({
    email: invitation.email,
    name: invitation.name,
  });
}
