import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { buildBilingualEmail, buildPasswordResetEmail } from '@loyalty-os/email';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();
  const memberAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://member.loyalbase.dev';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (serviceClient.auth as any).admin.generateLink({
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

  if (!RESEND_API_KEY) {
    console.error('[forgot-password] RESEND_API_KEY is not set — email not sent');
    return NextResponse.json({ ok: true });
  }

  const { enSubject, esSubject, enHtmlContent, esHtmlContent } = buildPasswordResetEmail({ recoveryUrl });
  const { subject, html } = buildBilingualEmail({ enSubject, esSubject, enHtmlContent, esHtmlContent });

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'LoyaltyOS <noreply@loyalbase.dev>',
      to: [email.trim().toLowerCase()],
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    const resendError = await resendRes.text();
    console.error('[forgot-password] Resend error:', resendRes.status, resendError);
  }

  return NextResponse.json({ ok: true });
}
