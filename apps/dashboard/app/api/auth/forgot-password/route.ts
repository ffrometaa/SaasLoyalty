import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { buildBilingualEmail, buildPasswordResetEmail } from '@loyalty-os/email';

interface AuthWithAdmin {
  admin: {
    generateLink(params: { type: string; email: string; options?: { redirectTo?: string } }): Promise<{
      data: { properties?: { action_link?: string } } | null; error: Error | null;
    }>;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json() as { email?: unknown };
  const { email } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Service role required: auth admin link generation — bypasses RLS
  const serviceClient = createServiceRoleClient();
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dashboard.loyalbase.dev';

  const { data, error } = await (serviceClient.auth as unknown as AuthWithAdmin).admin.generateLink({
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
    const { enSubject, esSubject, enHtmlContent, esHtmlContent } = buildPasswordResetEmail({
      recoveryUrl,
      appName: 'LoyaltyOS Dashboard',
    });
    const { subject, html } = buildBilingualEmail({ enSubject, esSubject, enHtmlContent, esHtmlContent });

    await fetch('https://api.resend.com/emails', {
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
  }

  return NextResponse.json({ ok: true });
}
