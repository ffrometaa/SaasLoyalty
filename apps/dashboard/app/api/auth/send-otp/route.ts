import { NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { buildBilingualEmail, buildOtpVerificationEmail } from '@loyalty-os/email';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST() {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceRoleClient();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused OTPs for this user
    await service
      .from('login_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('auth_user_id', user.id)
      .is('used_at', null);

    await service.from('login_otps').insert({
      auth_user_id: user.id,
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
    });

    // Send OTP via Resend
    // From address should match tenant custom domain when available for better deliverability.
    // Default: LoyaltyOS <security@loyalbase.dev>
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { enSubject, esSubject, enHtmlContent, esHtmlContent } = buildOtpVerificationEmail({ otp });
    const { subject, html } = buildBilingualEmail({ enSubject, esSubject, enHtmlContent, esHtmlContent });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'LoyaltyOS <security@loyalbase.dev>',
        to: [user.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error('Resend error:', await res.text());
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ sent: true, email: user.email });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
