import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dashboard.loyalbase.dev';

  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'recovery',
    email: email.trim().toLowerCase(),
    options: {
      redirectTo: `${dashboardUrl}/auth/recovery`,
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
        subject: 'Restablecer tu contraseña — LoyaltyOS Dashboard',
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
<body style="font-family: sans-serif; background: #f8f9fa; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; border: 1px solid #e5e7eb;">
    <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 8px;">LoyaltyOS Dashboard</h1>
    <p style="color: #6b7280; font-size: 13px; margin: 0 0 32px;">Restablecer contraseña</p>

    <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón para crear una nueva.
    </p>

    <a href="${recoveryUrl}"
       style="display: block; background: #7c3aed; color: white; text-align: center;
              padding: 12px 24px; border-radius: 8px; text-decoration: none;
              font-size: 14px; font-weight: 500; margin-bottom: 24px;">
      Restablecer contraseña
    </a>

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      Este link expira en 1 hora. Si no solicitaste este cambio, podés ignorar este mensaje.
    </p>
  </div>
</body>
</html>`;
}
