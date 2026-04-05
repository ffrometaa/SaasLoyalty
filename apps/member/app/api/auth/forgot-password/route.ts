import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();
  const memberAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://member.loyalbase.dev';

  // Generate recovery link via admin API — no email sent by Supabase
  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'recovery',
    email: email.trim().toLowerCase(),
    options: {
      redirectTo: `${memberAppUrl}/auth/recovery`,
    },
  });

  if (error || !data?.properties?.action_link) {
    // Don't reveal whether the email exists
    return NextResponse.json({ ok: true });
  }

  const recoveryUrl = data.properties.action_link;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'LoyaltyOS <noreply@loyalbase.dev>',
        to: [email.trim().toLowerCase()],
        subject: 'Restablecer tu contraseña',
        html: buildResetEmail({ recoveryUrl }),
      }),
    });
  }

  return NextResponse.json({ ok: true });
}

function buildResetEmail({ recoveryUrl }: { recoveryUrl: string }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #faf8f4; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e8e4dc;">
    <h1 style="font-size: 24px; font-weight: 400; color: #2c2c2a; margin: 0 0 8px;">Restablecer contraseña</h1>
    <p style="color: #8a887f; font-size: 14px; margin: 0 0 32px;">LoyaltyOS</p>

    <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
      Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva.
    </p>

    <a href="${recoveryUrl}"
       style="display: block; background: #4a5440; color: white; text-align: center;
              padding: 14px 24px; border-radius: 12px; text-decoration: none;
              font-size: 15px; font-weight: 500; margin-bottom: 24px;">
      Restablecer contraseña
    </a>

    <p style="color: #8a887f; font-size: 12px; text-align: center; margin: 0;">
      Este link expira en 1 hora. Si no solicitaste este cambio, podés ignorar este mensaje.
    </p>
  </div>
</body>
</html>`;
}
