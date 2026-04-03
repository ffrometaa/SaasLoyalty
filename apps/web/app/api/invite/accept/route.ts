import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    // Get the authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) return NextResponse.json({ error: 'You must be logged in to accept an invitation' }, { status: 401 });

    // Use service role for DB operations (bypasses RLS)
    const admin = createServiceRoleClient();

    // Fetch and validate the invite
    const { data: invite } = await admin
      .from('invitations')
      .select('id, tenant_id, email, role, status, expires_at')
      .eq('token', token)
      .single();

    if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    if (invite.status !== 'pending') return NextResponse.json({ error: 'This invitation has already been used or revoked' }, { status: 410 });
    if (new Date(invite.expires_at) < new Date()) {
      await admin.from('invitations').update({ status: 'expired' }).eq('id', invite.id);
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    // Check if already a member
    const { data: existing } = await admin
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', invite.tenant_id)
      .eq('auth_user_id', session.user.id)
      .single();

    if (!existing) {
      // Link user to tenant
      const { error: insertError } = await admin.from('tenant_users').insert({
        tenant_id: invite.tenant_id,
        auth_user_id: session.user.id,
        email: session.user.email!,
        role: invite.role,
      });

      if (insertError) return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }

    // Mark invite as accepted
    await admin.from('invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('id', invite.id);

    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.loyalbase.dev';
    return NextResponse.json({ success: true, redirectUrl: dashboardUrl });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
