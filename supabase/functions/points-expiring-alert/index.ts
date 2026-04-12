// Alert members whose points will expire within 30 days
// Runs monthly (1st of each month at 10:00 UTC) via pg_cron
//
// Logic:
//   For each active tenant with points_expiration_days > 0:
//     Find members with points_balance > 0 whose points expire in <= 30 days
//     (last_visit_at + points_expiration_days <= now + 30 days)
//     Skip members who already received this alert in the last 25 days.

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
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const started = Date.now();
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);
  const dedupeWindow = new Date(now.getTime() - 25 * 86400000).toISOString();

  let totalAlerted = 0;
  const errors: string[] = [];

  try {
    const { data: tenants, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, business_name, points_expiration_days')
      .in('plan_status', ['active', 'trialing'])
      .gt('points_expiration_days', 0)
      .is('deleted_at', null);

    if (tenantErr) throw tenantErr;

    for (const tenant of tenants ?? []) {
      // Find members whose expiry date falls within the next 30 days
      // expiry_date = last_visit_at + points_expiration_days
      // We look for: last_visit_at <= in30Days - points_expiration_days
      const expiryThreshold = new Date(
        in30Days.getTime() - tenant.points_expiration_days * 86400000
      ).toISOString();

      const { data: members, error: membersErr } = await supabase
        .from('members')
        .select('id, name, email, points_balance, last_visit_at, accepts_email, accepts_push')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .gt('points_balance', 0)
        .lte('last_visit_at', expiryThreshold)
        .not('last_visit_at', 'is', null)
        .is('deleted_at', null);

      if (membersErr) { errors.push(`tenant ${tenant.id}: ${membersErr.message}`); continue; }
      if (!members || members.length === 0) continue;

      // Idempotency: skip members already alerted in the last 25 days
      const memberIds = members.map((m: { id: string }) => m.id);
      const { data: recentAlerts } = await supabase
        .from('notifications')
        .select('member_id')
        .eq('tenant_id', tenant.id)
        .eq('type', 'points_expiring')
        .in('member_id', memberIds)
        .gte('sent_at', dedupeWindow);

      const recentSet = new Set((recentAlerts ?? []).map((n: { member_id: string }) => n.member_id));

      for (const member of members) {
        if (recentSet.has(member.id)) continue;

        const expiresAt = new Date(
          new Date(member.last_visit_at as string).getTime() + tenant.points_expiration_days * 86400000
        );
        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000);
        const businessName = tenant.business_name as string;
        const memberName = (member.name as string) || 'there';
        const nowIso = new Date().toISOString();

        // Push
        if (member.accepts_push && ONESIGNAL_APP_ID && ONESIGNAL_API_KEY) {
          const res = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Basic ${ONESIGNAL_API_KEY}` },
            body: JSON.stringify({
              app_id: ONESIGNAL_APP_ID,
              include_external_user_ids: [member.id],
              headings: { en: `Your points expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}! ⏰` },
              contents: { en: `Use your ${(member.points_balance as number).toLocaleString()} points at ${businessName} before they expire.` },
              data: { type: 'points_expiring', daysLeft },
              url: MEMBER_APP_URL,
            }),
          });
          const resJson = await res.json() as { id?: string };
          await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            member_id: member.id,
            channel: 'push',
            type: 'points_expiring',
            subject: `Points expiring in ${daysLeft} days`,
            status: resJson.id ? 'sent' : 'failed',
            sent_at: resJson.id ? nowIso : null,
            data: { daysLeft, pointsBalance: member.points_balance, onesignalId: resJson.id },
          });
          if (resJson.id) totalAlerted++;
        }

        // Email
        if (member.accepts_email && RESEND_API_KEY && member.email) {
          const html = buildExpiryEmail(memberName, businessName, member.points_balance as number, daysLeft, expiresAt, MEMBER_APP_URL);
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: `${businessName} via LoyaltyOS <noreply@loyalbase.dev>`,
              to: [member.email as string],
              subject: `Your points expire in ${daysLeft} days / Tus puntos vencen en ${daysLeft} días ⏰`,
              html,
            }),
          });
          const resJson = await res.json() as { id?: string };
          await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            member_id: member.id,
            channel: 'email',
            type: 'points_expiring',
            subject: `Points expiring in ${daysLeft} days`,
            status: resJson.id ? 'sent' : 'failed',
            sent_at: resJson.id ? nowIso : null,
            data: { daysLeft, pointsBalance: member.points_balance, resendId: resJson.id },
          });
          if (resJson.id) totalAlerted++;
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`points-expiring-alert: ${totalAlerted} alerts sent in ${Date.now() - started}ms`);
  return new Response(
    JSON.stringify({ ok: true, totalAlerted, durationMs: Date.now() - started, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

function buildExpiryEmail(
  memberName: string,
  businessName: string,
  points: number,
  daysLeft: number,
  expiresAt: Date,
  appUrl: string,
): string {
  const expireDate = expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const expireDateEs = expiresAt.toLocaleDateString('es-AR', { month: 'long', day: 'numeric', year: 'numeric' });
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
        <tr><td style="background-color:#f59e0b; border-radius:12px 12px 0 0; padding:28px 40px; text-align:center;">
          <div style="font-size:36px; margin-bottom:8px;">⏰</div>
          <span style="font-size:22px; font-weight:800; color:#ffffff;">${businessName}</span>
        </td></tr>
        <tr><td style="background-color:#ffffff; padding:36px 40px;">
          <p style="margin:0 0 6px; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">EN</p>
          <h1 style="margin:0 0 12px; font-size:22px; font-weight:800; color:#0f172a;">Your points expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}! ⏰</h1>
          <p style="margin:0 0 16px; font-size:15px; color:#334155;">Hi <strong>${memberName}</strong>, don't let your points go to waste!</p>
          <div style="background:#fef3c7; border:1px solid #fbbf24; border-radius:12px; padding:20px 24px; margin:20px 0; text-align:center;">
            <p style="margin:0 0 4px; font-size:13px; color:#92400e; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Points expiring ${expireDate}</p>
            <p style="margin:0; font-size:32px; font-weight:900; color:#d97706;">${points.toLocaleString()} pts</p>
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
            <tr><td style="border-radius:8px; background-color:#7c3aed;">
              <a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Use My Points Now</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color:#ffffff; padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;"></td></tr></table></td></tr>
        <tr><td style="background-color:#ffffff; padding:28px 40px 36px;">
          <p style="margin:0 0 6px; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">ES</p>
          <h1 style="margin:0 0 12px; font-size:22px; font-weight:800; color:#0f172a;">¡Tus puntos vencen en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}! ⏰</h1>
          <p style="margin:0 0 16px; font-size:15px; color:#334155;">Hola <strong>${memberName}</strong>, ¡no dejes que tus puntos se pierdan!</p>
          <div style="background:#fef3c7; border:1px solid #fbbf24; border-radius:12px; padding:20px 24px; margin:20px 0; text-align:center;">
            <p style="margin:0 0 4px; font-size:13px; color:#92400e; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Puntos que vencen el ${expireDateEs}</p>
            <p style="margin:0; font-size:32px; font-weight:900; color:#d97706;">${points.toLocaleString()} pts</p>
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
            <tr><td style="border-radius:8px; background-color:#7c3aed;">
              <a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Usar Mis Puntos Ahora</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color:#f1f5f9; border-radius:0 0 12px 12px; padding:20px 40px; border-top:1px solid #e2e8f0; text-align:center;">
          <p style="margin:0; font-size:12px; color:#94a3b8;">LoyalBase LLC · St. Petersburg, FL 33702, USA</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
