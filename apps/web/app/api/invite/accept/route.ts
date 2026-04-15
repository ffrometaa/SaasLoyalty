import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    // Get the authenticated user
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'You must be logged in to accept an invitation' }, { status: 401 });

    // Service role required here — invite acceptance writes across tenant boundaries,
    // which intentionally bypasses RLS (admin operation, not user-scoped).
    const admin = createServiceRoleClient();

    // Fetch and validate the invite
    const { data: invite, error: inviteError } = await admin
      .from('invitations')
      .select('id, tenant_id, email, role, status, expires_at')
      .eq('token', token)
      .single();

    if (inviteError) return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 });
    if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    if (invite.status !== 'pending') return NextResponse.json({ error: 'This invitation has already been used or revoked' }, { status: 410 });
    if (new Date(invite.expires_at) < new Date()) {
      await admin.from('invitations').update({ status: 'expired' }).eq('id', invite.id);
      // expire error is non-critical — return 410 regardless
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    // Check if already a member
    const { data: existing, error: memberError } = await admin
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', invite.tenant_id)
      .eq('auth_user_id', user.id)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected when not yet a member
      return NextResponse.json({ error: 'Failed to check membership' }, { status: 500 });
    }

    if (!existing) {
      // Link user to tenant
      const { error: insertError } = await admin.from('tenant_users').insert({
        tenant_id: invite.tenant_id,
        auth_user_id: user.id,
        email: user.email!, // safe: Supabase auth always populates email for password-based accounts
        role: invite.role,
      });

      if (insertError) return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }

    // Mark invite as accepted — critical write, must not fail silently
    const { error: acceptError } = await admin.from('invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('id', invite.id);

    if (acceptError) return NextResponse.json({ error: 'Failed to finalize invitation' }, { status: 500 });

    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.loyalbase.dev';
    return NextResponse.json({ success: true, redirectUrl: dashboardUrl });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
