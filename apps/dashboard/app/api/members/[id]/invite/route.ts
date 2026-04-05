import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { buildBilingualEmail, buildMemberActivationEmail } from '@loyalty-os/email';

// POST /api/members/[id]/invite — Create invitation token and send email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceRoleClient();

    // Fetch member + tenant in one go (include join_code for email)
    const { data: member, error: memberError } = await serviceClient
      .from('members')
      .select('id, name, email, auth_user_id, tenant_id, tenants!inner(id, slug, business_name, brand_logo_url, brand_color_primary, join_code)')
      .eq('id', id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.auth_user_id) {
      return NextResponse.json({ error: 'Member already has an account' }, { status: 400 });
    }

    const tenant = member.tenants as unknown as {
      id: string;
      slug: string;
      business_name: string;
      brand_logo_url: string | null;
      brand_color_primary: string;
      join_code: string | null;
    };

    // Upsert invitation (replace any existing pending one for this member)
    const { data: invitation, error: inviteError } = await serviceClient
      .from('member_invitations')
      .upsert(
        {
          tenant_id: tenant.id,
          member_id: member.id,
          email: member.email,
          name: member.name,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
        },
        { onConflict: 'member_id', ignoreDuplicates: false }
      )
      .select('token')
      .single();

    if (inviteError || !invitation) {
      // Fallback: insert fresh
      const { data: newInvite, error: insertErr } = await serviceClient
        .from('member_invitations')
        .insert({
          tenant_id: tenant.id,
          member_id: member.id,
          email: member.email,
          name: member.name,
        })
        .select('token')
        .single();

      if (insertErr || !newInvite) {
        console.error('Failed to create invitation:', insertErr);
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
      }

      return sendInviteEmail(newInvite.token, member, tenant);
    }

    return sendInviteEmail(invitation.token, member, tenant);
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendInviteEmail(
  token: string,
  member: { name: string; email: string },
  tenant: { slug: string; business_name: string; brand_logo_url: string | null; brand_color_primary: string; join_code?: string | null }
) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const memberAppUrl = process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? 'https://member.loyalbase.dev';
  const registerUrl = `${memberAppUrl}/join?token=${token}&tenant=${tenant.slug}`;

  if (RESEND_API_KEY) {
    try {
      const emailContent = buildMemberActivationEmail({
        memberName: member.name,
        businessName: tenant.business_name,
        registerUrl,
        tenantLogoUrl: tenant.brand_logo_url ?? '',
        tenantPrimaryColor: tenant.brand_color_primary ?? '',
        joinCode: tenant.join_code ?? '',
        memberAppUrl,
      });
      const { subject, html } = buildBilingualEmail(emailContent);

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${tenant.business_name} <noreply@loyalbase.dev>`,
          to: [member.email],
          subject,
          html,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
    }
  }

  return NextResponse.json({ success: true, registerUrl });
}
