import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { buildFeedbackNotificationEmail } from '@loyalty-os/email';

const VALID_TYPES = ['bug', 'feature', 'general'] as const;
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

  const service = createServiceRoleClient();

  // Resolve tenant (owner or staff)
  const { data: ownerTenant } = await service
    .from('tenants')
    .select('id, business_name')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .single();

  let tenantId = ownerTenant?.id;
  let tenantName = ownerTenant?.business_name ?? '';

  if (!tenantId) {
    const { data: staffRecord } = await service
      .from('tenant_users')
      .select('tenant_id, tenants(business_name)')
      .eq('auth_user_id', user.id)
      .single();
    tenantId = staffRecord?.tenant_id;
    tenantName = (staffRecord?.tenants as { business_name: string } | null)?.business_name ?? '';
  }

  await service.from('feedback_submissions').insert({
    source: 'tenant',
    auth_user_id: user.id,
    tenant_id: tenantId ?? null,
    type,
    message,
  });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    const { subject, html } = buildFeedbackNotificationEmail({
      source: 'tenant',
      type,
      message,
      fromEmail: user.email ?? '',
      tenantName,
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
