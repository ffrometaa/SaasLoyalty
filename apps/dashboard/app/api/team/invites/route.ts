import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { getTenantForUser } from '../../../../lib/tenant';
import { buildBilingualEmail, buildTeamInviteEmail } from '@loyalty-os/email';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await getTenantForUser(supabase, session.user.id);
    if (!result) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const { data: invites } = await supabase
      .from('invitations')
      .select('id, email, role, status, created_at, expires_at')
      .eq('tenant_id', result.tenant.id)
      .in('status', ['pending'])
      .order('created_at', { ascending: false });

    return NextResponse.json({ invites: invites ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await getTenantForUser(supabase, session.user.id);
    if (!result) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    if (result.role !== 'owner') return NextResponse.json({ error: 'Only owners can invite team members' }, { status: 403 });

    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check not already a member
    const { data: existing } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', result.tenant.id)
      .eq('email', email)
      .single();
    if (existing) return NextResponse.json({ error: 'This user is already a team member' }, { status: 409 });

    // Check no pending invite for this email
    const { data: pendingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('tenant_id', result.tenant.id)
      .eq('email', email)
      .eq('status', 'pending')
      .single();
    if (pendingInvite) return NextResponse.json({ error: 'There is already a pending invite for this email' }, { status: 409 });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data: invite, error: insertError } = await supabase
      .from('invitations')
      .insert({
        tenant_id: result.tenant.id,
        invited_by: session.user.id,
        email,
        role: 'staff',
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });

    // Send invite email via Resend
    await sendInviteEmail({
      to: email,
      businessName: result.tenant.business_name,
      inviterEmail: session.user.email ?? '',
      token,
    });

    return NextResponse.json({ invite });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendInviteEmail({
  to,
  businessName,
  inviterEmail,
  token,
}: {
  to: string;
  businessName: string;
  inviterEmail: string;
  token: string;
}) {
  // From address should match tenant custom domain when available for better deliverability.
  // Default: LoyaltyOS <noreply@loyalbase.dev>
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  const webUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://loyalbase.dev';
  const inviteUrl = `${webUrl}/invite/${token}`;

  const { enSubject, esSubject, enHtmlContent, esHtmlContent } = buildTeamInviteEmail({
    businessName,
    inviterEmail,
    inviteUrl,
  });

  const { subject, html } = buildBilingualEmail({
    enSubject,
    esSubject,
    enHtmlContent,
    esHtmlContent,
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'LoyaltyOS <noreply@loyalbase.dev>',
      to: [to],
      subject,
      html,
    }),
  });
}
