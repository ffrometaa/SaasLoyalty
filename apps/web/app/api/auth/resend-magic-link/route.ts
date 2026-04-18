import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { getResendMagicLinkRatelimit } from '@/lib/ratelimit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthWithSignInOtp {
  signInWithOtp(params: {
    email: string;
    options?: { shouldCreateUser?: boolean; emailRedirectTo?: string };
  }): Promise<{ error: Error | null }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, type = 'magiclink' } = body as { email?: string; type?: string };

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Rate limiting
  const ratelimit = getResendMagicLinkRatelimit();
  if (ratelimit) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous';

    const { success, reset } = await ratelimit.limit(ip);

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      );
    }
  }

  const method = type === 'otp' ? 'otp' : 'magiclink';

  try {
    const supabase = createServiceRoleClient();
    const options: { shouldCreateUser: boolean; emailRedirectTo?: string } = {
      shouldCreateUser: false,
    };

    if (method === 'magiclink') {
      const dashboardUrl =
        process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://app.loyalbase.dev';
      options.emailRedirectTo = `${dashboardUrl}/auth/callback?next=/`;
    }

    const { error } = await (supabase.auth as unknown as AuthWithSignInOtp).signInWithOtp({
      email,
      options,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ sent: true, method });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
