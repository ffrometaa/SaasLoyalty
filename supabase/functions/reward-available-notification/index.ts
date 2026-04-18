// Notify all active members of a tenant when a new reward becomes available.
// Runs every 15 minutes via pg_cron.
//
// Logic:
//   Find rewards where is_active = true AND (created_at or updated_at) >= now() - 16 min.
//   For each reward, fan-out to all active members of the same tenant.
//   Dedup: skip member if notifications row already exists with type='reward_available'
//     AND data->>'rewardId' = reward.id.
//   Send push notification (OneSignal) and/or email (Resend) based on member preferences.
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const started = Date.now();
  const now = new Date();
  let delivered = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // Find rewards recently activated or created (within last 16 minutes)
    const { data: rewards, error: rewardsErr } = await supabase
      .from('rewards')
      .select('id, name, points_cost, tenant_id')
      .eq('is_active', true)
      .or(`created_at.gte.${new Date(Date.now() - 16 * 60 * 1000).toISOString()},updated_at.gte.${new Date(Date.now() - 16 * 60 * 1000).toISOString()}`);

    if (rewardsErr) throw rewardsErr;

    if (!rewards || rewards.length === 0) {
      console.log(`[reward-available-notification] delivered=0 skipped=0 errors=0 durationMs=${Date.now() - started}`);
      return Response.json({ ok: true, delivered: 0, skipped: 0, durationMs: Date.now() - started, errors: [] });
    }

    for (const reward of rewards) {
      // Fetch all active members for this tenant
      const { data: members, error: membersErr } = await supabase
        .from('members')
        .select('id, name, email, accepts_push, accepts_email')
        .eq('tenant_id', reward.tenant_id)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (membersErr) {
        errors.push(`members fetch for reward ${reward.id}: ${membersErr.message}`);
        continue;
      }

      if (!members || members.length === 0) continue;

      // Fetch tenant info for business name
      const { data: tenant } = await supabase
        .from('tenants')
        .select('business_name')
        .eq('id', reward.tenant_id)
        .single();

      const businessName = (tenant?.business_name as string) ?? 'LoyaltyOS';
      const rewardName = (reward.name as string) ?? 'Reward';
      const pointsCost = reward.points_cost as number;

      // Fetch existing dedup notifications for this reward across all members
      const memberIds = members.map((m: { id: string }) => m.id);
      const { data: existingNotifs } = await supabase
        .from('notifications')
        .select('member_id, data')
        .eq('type', 'reward_available')
        .in('member_id', memberIds);

      const alreadyNotifiedSet = new Set<string>(
        (existingNotifs ?? [])
          .filter((n: { member_id: string; data: Record<string, unknown> }) => {
            const d = n.data as Record<string, unknown>;
            return d && d['rewardId'] === reward.id;
          })
          .map((n: { member_id: string }) => n.member_id)
      );

      for (const member of members) {
        // Per-member dedup
        if (alreadyNotifiedSet.has(member.id as string)) {
          skipped++;
          continue;
        }

        const memberName = (member.name as string) || 'there';

        try {
          // Send push notification
          if (member.accepts_push && ONESIGNAL_APP_ID && ONESIGNAL_API_KEY) {
            const pushRes = await fetch('https://onesignal.com/api/v1/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${ONESIGNAL_API_KEY}`,
              },
              body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_external_user_ids: [member.id],
                headings: {
                  en: 'New reward available! 🎁',
                  es: '¡Nueva recompensa disponible! 🎁',
                },
                contents: {
                  en: `${rewardName} — only ${pointsCost} pts at ${businessName}`,
                  es: `${rewardName} — solo ${pointsCost} pts en ${businessName}`,
                },
                data: { type: 'reward_available', rewardId: reward.id, rewardName, pointsCost },
                url: MEMBER_APP_URL,
              }),
            });

            const pushJson = await pushRes.json() as { id?: string };

            await supabase.from('notifications').insert({
              tenant_id: reward.tenant_id,
              member_id: member.id,
              channel: 'push',
              type: 'reward_available',
              subject: `New reward available: ${rewardName}`,
              title: 'New reward available! 🎁',
              content: `${rewardName} — only ${pointsCost} pts at ${businessName}`,
              status: pushJson.id ? 'sent' : 'failed',
              sent_at: pushJson.id ? now.toISOString() : null,
              data: { rewardId: reward.id, rewardName, pointsCost, onesignalId: pushJson.id },
            });

            if (pushJson.id) delivered++;
          }

          // Send email notification
          if (member.accepts_email && RESEND_API_KEY && member.email) {
            const enSubject = `New reward available at ${businessName}! 🎁`;
            const esSubject = `¡Nueva recompensa disponible en ${businessName}! 🎁`;
            const subject = `${enSubject} / ${esSubject}`;

            const html = buildRewardAvailableEmail(memberName, businessName, rewardName, pointsCost, MEMBER_APP_URL);

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
              tenant_id: reward.tenant_id,
              member_id: member.id,
              channel: 'email',
              type: 'reward_available',
              subject,
              title: 'New reward available! 🎁',
              content: `${rewardName} — only ${pointsCost} pts at ${businessName}`,
              status: emailJson.id ? 'sent' : 'failed',
              sent_at: emailJson.id ? now.toISOString() : null,
              data: { rewardId: reward.id, rewardName, pointsCost, resendId: emailJson.id },
            });

            if (emailJson.id) delivered++;
          }
        } catch (memberErr) {
          const msg = memberErr instanceof Error ? memberErr.message : String(memberErr);
          errors.push(`member ${member.id as string} reward ${reward.id as string}: ${msg}`);
        }
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

  console.log(`[reward-available-notification] delivered=${delivered} skipped=${skipped} errors=${errors.length} durationMs=${Date.now() - started}`);

  return Response.json({ ok: true, delivered, skipped, durationMs: Date.now() - started, errors });
});

function buildRewardAvailableEmail(
  memberName: string,
  businessName: string,
  rewardName: string,
  pointsCost: number,
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
                <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a; line-height:1.2;">New Reward Available! 🎁</h1>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Hi <strong>${memberName}</strong>! A new reward just dropped at <strong>${businessName}</strong>.</p>
                <div style="background:linear-gradient(135deg,#7c3aed18,#6366f118); border:1px solid #7c3aed40; border-radius:12px; padding:24px 32px; margin:20px 0; text-align:center;">
                  <div style="font-size:32px; margin-bottom:8px;">🎁</div>
                  <p style="margin:0; font-size:20px; font-weight:800; color:#0f172a; line-height:1.3;">${rewardName}</p>
                  <p style="margin:8px 0 0; font-size:15px; color:#7c3aed; font-weight:700;">${pointsCost} pts</p>
                  <p style="margin:4px 0 0; font-size:13px; color:#64748b;">at ${businessName}</p>
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr><td style="border-radius:8px; background-color:#7c3aed;"><a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Redeem Now</a></td></tr>
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
                <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a; line-height:1.2;">¡Nueva Recompensa Disponible! 🎁</h1>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">¡Hola <strong>${memberName}</strong>! Acaba de llegar una nueva recompensa en <strong>${businessName}</strong>.</p>
                <div style="background:linear-gradient(135deg,#7c3aed18,#6366f118); border:1px solid #7c3aed40; border-radius:12px; padding:24px 32px; margin:20px 0; text-align:center;">
                  <div style="font-size:32px; margin-bottom:8px;">🎁</div>
                  <p style="margin:0; font-size:20px; font-weight:800; color:#0f172a; line-height:1.3;">${rewardName}</p>
                  <p style="margin:8px 0 0; font-size:15px; color:#7c3aed; font-weight:700;">${pointsCost} pts</p>
                  <p style="margin:4px 0 0; font-size:13px; color:#64748b;">en ${businessName}</p>
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr><td style="border-radius:8px; background-color:#7c3aed;"><a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Canjear Ahora</a></td></tr>
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
