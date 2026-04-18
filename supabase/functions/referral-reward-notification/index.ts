// Send push + email notifications when a member earns a referral bonus.
// Triggered by a webhook / pg_net call after a 'referral' transaction is created.
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

  // Kill switch
  if (Deno.env.get('DISABLE_MEMBER_NOTIFICATIONS') === 'true') {
    return Response.json({ ok: true, skipped: 'disabled', durationMs: 0 });
  }

  const body = await req.json() as {
    transaction_id: string;
    member_id: string;
    tenant_id: string;
    points_earned: number;
    balance_after: number;
    reference_id?: string;
  };

  const { transaction_id, member_id, tenant_id, points_earned, balance_after, reference_id } = body;

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
    // Fetch referrer member
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

    // Optionally fetch referred member's name for personalized copy
    let referredName = '';
    if (reference_id) {
      const { data: referredMember } = await supabase
        .from('members')
        .select('name')
        .eq('id', reference_id)
        .single();
      referredName = (referredMember?.name as string) || '';
    }

    const referredDisplay = referredName || 'A friend';

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
              en: `Your referral joined! +${points_earned} pts`,
              es: `¡Tu referido se unió! +${points_earned} pts`,
            },
            contents: {
              en: `${referredDisplay} joined through your referral link`,
              es: `${referredDisplay} se unió a través de tu enlace de referido`,
            },
            data: { type: 'referral_reward', bonusPoints: points_earned, balanceAfter: balance_after, referenceId: reference_id },
            url: MEMBER_APP_URL,
          }),
        });

        const pushJson = await pushRes.json() as { id?: string };

        await supabase.from('notifications').insert({
          tenant_id,
          member_id,
          channel: 'push',
          type: 'referral_reward',
          subject: `Your referral joined! +${points_earned} pts`,
          title: `Your referral joined! +${points_earned} pts`,
          content: `${referredDisplay} joined through your referral link`,
          status: pushJson.id ? 'sent' : 'failed',
          sent_at: pushJson.id ? now.toISOString() : null,
          data: { bonusPoints: points_earned, balanceAfter: balance_after, referenceId: reference_id, onesignalId: pushJson.id, transactionId: transaction_id },
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
        const enSubject = `Referral confirmed! You earned ${points_earned} bonus points`;
        const esSubject = `¡Referido confirmado! Ganaste ${points_earned} puntos de bonificación`;
        const subject = `${enSubject} / ${esSubject}`;

        const html = buildReferralBonusHtml(memberName, referredName, businessName, points_earned, balance_after, MEMBER_APP_URL);

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
          type: 'referral_reward',
          subject,
          title: `Referral confirmed! +${points_earned} pts`,
          content: `${referredDisplay} joined through your referral link`,
          status: emailJson.id ? 'sent' : 'failed',
          sent_at: emailJson.id ? now.toISOString() : null,
          data: { bonusPoints: points_earned, balanceAfter: balance_after, referenceId: reference_id, resendId: emailJson.id, transactionId: transaction_id },
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

  console.log(`[referral-reward-notification] delivered=${delivered} skipped=${skipped} errors=${errors.length} durationMs=${Date.now() - started}`);

  return new Response(
    JSON.stringify({ ok: true, delivered, skipped, durationMs: Date.now() - started, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

function buildReferralBonusHtml(
  memberName: string,
  referredName: string,
  businessName: string,
  bonusPoints: number,
  newTotalBalance: number,
  appUrl: string,
): string {
  const referredLine = referredName
    ? `<div style="background:#7c3aed18; border:1px solid #7c3aed40; border-radius:8px; padding:16px 20px; margin:16px 0;"><p style="margin:0; font-size:15px; color:#0f172a;"><strong>${referredName}</strong> joined the loyalty program through your referral.</p></div>`
    : '';
  const referredLineEs = referredName
    ? `<div style="background:#7c3aed18; border:1px solid #7c3aed40; border-radius:8px; padding:16px 20px; margin:16px 0;"><p style="margin:0; font-size:15px; color:#0f172a;"><strong>${referredName}</strong> se unió al programa de fidelización a través de tu referido.</p></div>`
    : '';

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
                <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a; line-height:1.2;">Referral Bonus Earned! 🤝</h1>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Great news, <strong>${memberName}</strong>! Your referral has been confirmed.</p>
                ${referredLine}
                <div style="text-align:center; margin:20px 0;">
                  <div style="display:inline-block; background:linear-gradient(135deg,#7c3aed18,#6366f118); border:1px solid #7c3aed40; border-radius:12px; padding:20px 36px;">
                    <p style="margin:0; font-size:40px; font-weight:900; color:#7c3aed; line-height:1;">${bonusPoints}</p>
                    <p style="margin:4px 0 0; font-size:13px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">Bonus points earned</p>
                  </div>
                </div>
                <div style="background:#7c3aed18; border:1px solid #7c3aed40; border-radius:8px; padding:16px 20px; margin:16px 0;">
                  <p style="margin:0; font-size:15px; color:#0f172a;"><strong>New total balance:</strong> ${newTotalBalance} points</p>
                </div>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Keep referring friends and earn more rewards! Every referral brings you closer to exclusive benefits.</p>
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
                <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a; line-height:1.2;">¡Bono de Referido Ganado! 🤝</h1>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">¡Buenas noticias, <strong>${memberName}</strong>! Tu referido fue confirmado.</p>
                ${referredLineEs}
                <div style="text-align:center; margin:20px 0;">
                  <div style="display:inline-block; background:linear-gradient(135deg,#7c3aed18,#6366f118); border:1px solid #7c3aed40; border-radius:12px; padding:20px 36px;">
                    <p style="margin:0; font-size:40px; font-weight:900; color:#7c3aed; line-height:1;">${bonusPoints}</p>
                    <p style="margin:4px 0 0; font-size:13px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">Puntos de bonificación ganados</p>
                  </div>
                </div>
                <div style="background:#7c3aed18; border:1px solid #7c3aed40; border-radius:8px; padding:16px 20px; margin:16px 0;">
                  <p style="margin:0; font-size:15px; color:#0f172a;"><strong>Nuevo saldo total:</strong> ${newTotalBalance} puntos</p>
                </div>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">¡Seguí referenciando amigos y ganá más recompensas! Cada referido te acerca a beneficios exclusivos.</p>
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
