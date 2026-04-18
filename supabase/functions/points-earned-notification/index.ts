// Send push + email notifications when a member earns points on a transaction.
// Triggered by a webhook / pg_net call after a 'earn' transaction is created.
//
// Required env vars:
//   SUPABASE_URL               — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY  — Service role key (bypasses RLS)
//   CRON_SECRET                — Shared secret for Authorization: Bearer <secret>
//   RESEND_API_KEY             — Resend API key for email delivery
//   ONESIGNAL_APP_ID           — OneSignal app ID for push notifications
//   ONESIGNAL_API_KEY          — OneSignal REST API key
//   MEMBER_APP_URL             — Base URL for the member app (default: https://app.loyalbase.dev)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY') ?? '';
const MEMBER_APP_URL = Deno.env.get('MEMBER_APP_URL') ?? 'https://app.loyalbase.dev';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Validate CRON_SECRET
  const authHeader = req.headers.get('Authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json() as {
    transaction_id: string;
    member_id: string;
    tenant_id: string;
    points_earned: number;
    balance_after: number;
  };

  const { transaction_id, member_id, tenant_id, points_earned, balance_after } = body;

  if (!member_id || !tenant_id) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const started = Date.now();
  const now = new Date();
  let delivered = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // Fetch member
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, name, email, accepts_push, accepts_email, status, deleted_at')
      .eq('id', member_id)
      .single();

    if (memberErr || !member) {
      return new Response(JSON.stringify({ ok: false, error: 'Member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Skip inactive or deleted members
    if (member.status !== 'active' || member.deleted_at !== null) {
      skipped++;
      return new Response(
        JSON.stringify({ ok: true, delivered: 0, skipped: 1, durationMs: Date.now() - started, errors: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch tenant
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .select('business_name')
      .eq('id', tenant_id)
      .single();

    if (tenantErr || !tenant) {
      return new Response(JSON.stringify({ ok: false, error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const businessName = tenant.business_name ?? 'LoyaltyOS';
    const memberName = (member.name as string) || 'there';

    // Send push notification
    if (member.accepts_push && ONESIGNAL_APP_ID && ONESIGNAL_API_KEY) {
      try {
        const pushRes = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${ONESIGNAL_API_KEY}`,
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: [member_id],
            headings: {
              en: `You earned ${points_earned} points at ${businessName}!`,
              es: `¡Ganaste ${points_earned} puntos en ${businessName}!`,
            },
            contents: {
              en: `Great visit! Your new balance is ${balance_after} points.`,
              es: `¡Gran visita! Tu nuevo saldo es ${balance_after} puntos.`,
            },
            data: { type: 'points_earned', pointsEarned: points_earned, balanceAfter: balance_after },
            url: MEMBER_APP_URL,
          }),
        });

        const pushJson = await pushRes.json() as { id?: string };

        await supabase.from('notifications').insert({
          tenant_id,
          member_id,
          channel: 'push',
          type: 'points_earned',
          subject: `You earned ${points_earned} points at ${businessName}`,
          title: `You earned ${points_earned} points!`,
          content: `Your new balance is ${balance_after} points.`,
          status: pushJson.id ? 'sent' : 'failed',
          sent_at: pushJson.id ? now.toISOString() : null,
          data: { pointsEarned: points_earned, balanceAfter: balance_after, onesignalId: pushJson.id, transactionId: transaction_id },
        });

        if (pushJson.id) delivered++;
      } catch (pushErr) {
        const msg = pushErr instanceof Error ? pushErr.message : String(pushErr);
        errors.push(`push: ${msg}`);
      }
    }

    // Send email notification
    if (member.accepts_email && RESEND_API_KEY && member.email) {
      try {
        const enSubject = `You earned ${points_earned} points at ${businessName}!`;
        const esSubject = `¡Ganaste ${points_earned} puntos en ${businessName}!`;
        const subject = `${enSubject} / ${esSubject}`;

        const html = buildPointsEarnedHtml(memberName, businessName, points_earned, balance_after, MEMBER_APP_URL);

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `${businessName} via LoyaltyOS <noreply@loyalbase.dev>`,
            to: [member.email as string],
            subject,
            html,
          }),
        });

        const emailJson = await emailRes.json() as { id?: string };

        await supabase.from('notifications').insert({
          tenant_id,
          member_id,
          channel: 'email',
          type: 'points_earned',
          subject,
          title: `You earned ${points_earned} points!`,
          content: `Your new balance is ${balance_after} points.`,
          status: emailJson.id ? 'sent' : 'failed',
          sent_at: emailJson.id ? now.toISOString() : null,
          data: { pointsEarned: points_earned, balanceAfter: balance_after, resendId: emailJson.id, transactionId: transaction_id },
        });

        if (emailJson.id) delivered++;
      } catch (emailErr) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        errors.push(`email: ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(
    `points-earned-notification: member=${member_id} delivered=${delivered} skipped=${skipped} in ${Date.now() - started}ms`
  );

  return new Response(
    JSON.stringify({ ok: true, delivered, skipped, durationMs: Date.now() - started, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

function buildPointsEarnedHtml(
  memberName: string,
  businessName: string,
  pointsEarned: number,
  totalBalance: number,
  appUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
        <tr>
          <td style="background-color:#ffffff; border-radius:12px 12px 0 0; padding:28px 40px; text-align:center; border-bottom:1px solid #e2e8f0;">
            <span style="font-size:24px; font-weight:800; letter-spacing:-0.5px; font-family:system-ui,-apple-system,sans-serif;"><span style="color:#1a1a3e;">Loyal</span><span style="color:#5C50E8;">Base</span></span>
            ${businessName ? `<p style="margin:6px 0 0; font-size:13px; color:#64748b;">${businessName}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff; padding:36px 40px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="text-align:right; padding-bottom:12px;"><span style="font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; background:#f1f5f9; border-radius:4px; padding:3px 8px;">EN</span></td></tr>
              <tr><td>
                <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a; line-height:1.2;">Points Earned! ⭐</h1>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Great visit, <strong>${memberName}</strong>! Here's your points update:</p>
                <div style="text-align:center; margin:20px 0;">
                  <div style="display:inline-block; background:linear-gradient(135deg,#7c3aed18,#6366f118); border:1px solid #7c3aed40; border-radius:12px; padding:20px 36px;">
                    <p style="margin:0; font-size:40px; font-weight:900; color:#7c3aed; line-height:1;">${pointsEarned}</p>
                    <p style="margin:4px 0 0; font-size:13px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">Points earned this visit</p>
                  </div>
                </div>
                <div style="background:#7c3aed18; border:1px solid #7c3aed40; border-radius:8px; padding:16px 20px; margin:16px 0;">
                  <p style="margin:0; font-size:15px; color:#0f172a;"><strong>New total balance:</strong> ${totalBalance} points</p>
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr><td style="border-radius:8px; background-color:#7c3aed;"><a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">View Rewards</a></td></tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="background-color:#ffffff; padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;"></td></tr></table></td></tr>
        <tr>
          <td style="background-color:#ffffff; padding:28px 40px 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="text-align:right; padding-bottom:12px;"><span style="font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; background:#f1f5f9; border-radius:4px; padding:3px 8px;">ES</span></td></tr>
              <tr><td>
                <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a; line-height:1.2;">¡Puntos ganados! ⭐</h1>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">¡Gran visita, <strong>${memberName}</strong>! Acá está tu actualización de puntos:</p>
                <div style="text-align:center; margin:20px 0;">
                  <div style="display:inline-block; background:linear-gradient(135deg,#7c3aed18,#6366f118); border:1px solid #7c3aed40; border-radius:12px; padding:20px 36px;">
                    <p style="margin:0; font-size:40px; font-weight:900; color:#7c3aed; line-height:1;">${pointsEarned}</p>
                    <p style="margin:4px 0 0; font-size:13px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">Puntos ganados en esta visita</p>
                  </div>
                </div>
                <div style="background:#7c3aed18; border:1px solid #7c3aed40; border-radius:8px; padding:16px 20px; margin:16px 0;">
                  <p style="margin:0; font-size:15px; color:#0f172a;"><strong>Nuevo saldo total:</strong> ${totalBalance} puntos</p>
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr><td style="border-radius:8px; background-color:#7c3aed;"><a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Ver Recompensas</a></td></tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f1f5f9; border-radius:0 0 12px 12px; padding:24px 40px; border-top:1px solid #e2e8f0; text-align:center;">
            <p style="margin:0 0 8px; font-size:13px; color:#64748b;">
              <a href="#" style="color:#94a3b8; text-decoration:underline;">Unsubscribe</a>
              &nbsp;·&nbsp;
              <a href="#" style="color:#94a3b8; text-decoration:underline;">Cancelar suscripción</a>
            </p>
            <p style="margin:0; font-size:12px; color:#94a3b8;">LoyalBase LLC · St. Petersburg, FL 33702, USA</p>
            <p style="margin:4px 0 0; font-size:11px; color:#cbd5e1;">Powered by <strong style="color:#5C50E8;">Loyal</strong><strong style="color:#5C50E8;">Base</strong></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
