import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceRoleClient();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused OTPs for this user
    await service
      .from('login_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('auth_user_id', session.user.id)
      .is('used_at', null);

    await service.from('login_otps').insert({
      auth_user_id: session.user.id,
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
    });

    // Send OTP via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'LoyaltyOS <security@loyalbase.dev>',
        to: [session.user.email],
        subject: `${otp} es tu código de verificación LoyaltyOS`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #fff; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #7c3aed, #2563eb); padding: 28px 32px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Código de verificación</h1>
              <p style="margin: 6px 0 0; opacity: 0.8; font-size: 13px;">LoyaltyOS Dashboard</p>
            </div>
            <div style="padding: 32px; text-align: center;">
              <p style="font-size: 14px; color: rgba(255,255,255,0.6); margin: 0 0 24px;">
                Detectamos un inicio de sesión desde un dispositivo nuevo. Ingresá este código para continuar:
              </p>
              <div style="display: inline-block; background: rgba(124,58,237,0.15); border: 2px solid rgba(124,58,237,0.4); border-radius: 12px; padding: 20px 40px; margin-bottom: 24px;">
                <span style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #a78bfa; font-family: monospace;">${otp}</span>
              </div>
              <p style="font-size: 12px; color: rgba(255,255,255,0.35); margin: 0;">
                Este código vence en <strong style="color: rgba(255,255,255,0.5);">10 minutos</strong>.<br>
                Si no fuiste vos, ignorá este email y cambiá tu contraseña.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error('Resend error:', await res.text());
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ sent: true, email: session.user.email });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
