import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { buildFeedbackNotificationEmail } from '@loyalty-os/email';
import { cookies } from 'next/headers';

const VALID_TYPES = ['bug', 'suggestion', 'general'] as const;
type FeedbackType = typeof VALID_TYPES[number];

export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { type?: string; message?: string };
  const type = body.type as FeedbackType;
  const message = body.message?.trim() ?? '';

  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });
  if (!(VALID_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const tenantId = (await cookies()).get('loyalty_tenant_id')?.value ?? null;

  const service = createServiceRoleClient();

  await service.from('feedback_submissions').insert({
    source: 'member',
    auth_user_id: user.id,
    tenant_id: tenantId,
    type,
    message,
  });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    const { subject, html } = buildFeedbackNotificationEmail({
      source: 'member',
      type,
      message,
      fromEmail: user.email ?? '',
    });
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'LoyaltyOS <noreply@loyalbase.dev>',
        to: ['hello@loyalbase.dev'],
        subject,
        html,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ sent: true });
}
