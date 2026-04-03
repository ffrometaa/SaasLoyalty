import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServiceRoleClient();

    const { data: invite } = await supabase
      .from('invitations')
      .select('id, email, role, status, expires_at, tenant_id, invited_by, tenants(business_name)')
      .eq('token', token)
      .single();

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'This invitation has already been used or revoked', status: invite.status }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      await supabase.from('invitations').update({ status: 'expired' }).eq('id', invite.id);
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    const tenant = invite.tenants as any;

    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      businessName: tenant?.business_name ?? '',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
