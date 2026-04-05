import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

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

    // Fetch member + tenant in one go
    const { data: member, error: memberError } = await serviceClient
      .from('members')
      .select('id, name, email, auth_user_id, tenant_id, tenants!inner(id, slug, business_name, brand_logo_url, brand_color_primary)')
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
  tenant: { slug: string; business_name: string; brand_logo_url: string | null; brand_color_primary: string }
) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const memberAppUrl = process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? 'https://member.loyalbase.dev';
  const registerUrl = `${memberAppUrl}/register?token=${token}&tenant=${tenant.slug}`;

  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${tenant.business_name} <noreply@loyalbase.dev>`,
          to: [member.email],
          subject: `${tenant.business_name} te invita a su programa de fidelidad`,
          html: buildInviteEmail({ memberName: member.name, businessName: tenant.business_name, registerUrl }),
        }),
      });
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
    }
  }

  return NextResponse.json({ success: true, registerUrl });
}

function buildInviteEmail({
  memberName,
  businessName,
  registerUrl,
}: {
  memberName: string;
  businessName: string;
  registerUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #faf8f4; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e8e4dc;">
    <h1 style="font-size: 24px; font-weight: 400; color: #2c2c2a; margin: 0 0 8px;">${businessName}</h1>
    <p style="color: #8a887f; font-size: 14px; margin: 0 0 32px;">Programa de fidelidad</p>

    <p style="color: #2c2c2a; font-size: 15px; margin: 0 0 8px;">Hola ${memberName},</p>
    <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
      Te invitamos a activar tu cuenta en el programa de fidelidad de <strong>${businessName}</strong>.
      Crea tu contraseña para acceder a tus puntos y recompensas.
    </p>

    <a href="${registerUrl}"
       style="display: block; background: #4a5440; color: white; text-align: center;
              padding: 14px 24px; border-radius: 12px; text-decoration: none;
              font-size: 15px; font-weight: 500; margin-bottom: 24px;">
      Activar mi cuenta
    </a>

    <p style="color: #8a887f; font-size: 12px; text-align: center; margin: 0;">
      Este link expira en 7 días. Si no esperabas esta invitación, puedes ignorar este mensaje.
    </p>
  </div>
</body>
</html>`;
}
