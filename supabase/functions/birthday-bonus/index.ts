// Award birthday bonus points and send notifications to members on their birthday
// Runs daily at 09:00 UTC via pg_cron
//
// Logic:
//   Find all active members whose birthday month+day matches today.
//   Award BIRTHDAY_BONUS_POINTS points + create 'birthday' transaction.
//   Send push notification (OneSignal) and/or email (Resend) based on member preferences.
//
// Idempotency: skips members who already have a 'birthday' transaction this calendar year.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY') ?? '';
const MEMBER_APP_URL = Deno.env.get('MEMBER_APP_URL') ?? 'https://app.loyalbase.dev';

const BIRTHDAY_BONUS_POINTS = 50;

interface TenantInfo {
  business_name: string;
  brand_color_primary: string | null;
}

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const started = Date.now();
  const now = new Date();
  const todayMonth = now.getUTCMonth() + 1; // 1-12
  const todayDay = now.getUTCDate();
  const thisYear = now.getUTCFullYear();
  const yearStart = new Date(thisYear, 0, 1).toISOString();

  let totalBonusAwarded = 0;
  let totalEmailsSent = 0;
  let totalPushSent = 0;
  const errors: string[] = [];

  try {
    // Find all active members whose birthday is today (month + day match, year-agnostic)
    // birthday is a DATE column: YYYY-MM-DD
    // We use RPC to match EXTRACT(month) and EXTRACT(day) regardless of birth year
    const { data: birthdayMembers, error: membersErr } = await supabase
      .rpc('get_birthday_members_today', {
        p_month: todayMonth,
        p_day: todayDay,
      });

    if (membersErr) throw membersErr;

    if (!birthdayMembers || birthdayMembers.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, totalBonusAwarded: 0, totalEmailsSent: 0, totalPushSent: 0, durationMs: Date.now() - started }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency: find members who already got a birthday bonus this year
    const memberIds = birthdayMembers.map((m: { id: string }) => m.id);
    const { data: alreadyRewarded } = await supabase
      .from('transactions')
      .select('member_id')
      .eq('type', 'birthday')
      .in('member_id', memberIds)
      .gte('created_at', yearStart);

    const alreadyRewardedSet = new Set(
      (alreadyRewarded ?? []).map((t: { member_id: string }) => t.member_id)
    );

    for (const member of birthdayMembers) {
      if (alreadyRewardedSet.has(member.id)) continue;

      const tenant = member.tenants as TenantInfo | null;
      const businessName = tenant?.business_name ?? 'LoyaltyOS';
      const newBalance = (member.points_balance as number) + BIRTHDAY_BONUS_POINTS;

      // Create birthday transaction
      const { error: txErr } = await supabase.from('transactions').insert({
        tenant_id: member.tenant_id,
        member_id: member.id,
        type: 'birthday',
        points: BIRTHDAY_BONUS_POINTS,
        balance_after: newBalance,
        description: `Birthday bonus — ${BIRTHDAY_BONUS_POINTS} points`,
        reference_id: null,
      });

      if (txErr) {
        errors.push(`tx ${member.id}: ${txErr.message}`);
        continue;
      }

      // Update member balance
      const { error: updateErr } = await supabase
        .from('members')
        .update({ points_balance: newBalance, updated_at: now.toISOString() })
        .eq('id', member.id);

      if (updateErr) {
        errors.push(`balance ${member.id}: ${updateErr.message}`);
        continue;
      }

      totalBonusAwarded++;

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
            headings: { en: `Happy Birthday from ${businessName}! 🎂` },
            contents: {
              en: `We're celebrating you! ${BIRTHDAY_BONUS_POINTS} bonus points have been added to your account.`,
            },
            data: { type: 'birthday', bonusPoints: BIRTHDAY_BONUS_POINTS },
            url: MEMBER_APP_URL,
          }),
        });

        const pushJson = await pushRes.json() as { id?: string };

        await supabase.from('notifications').insert({
          tenant_id: member.tenant_id,
          member_id: member.id,
          channel: 'push',
          type: 'birthday',
          subject: `Happy Birthday from ${businessName}`,
          status: pushJson.id ? 'sent' : 'failed',
          sent_at: pushJson.id ? now.toISOString() : null,
          data: { bonusPoints: BIRTHDAY_BONUS_POINTS, onesignalId: pushJson.id },
        });

        if (pushJson.id) totalPushSent++;
      }

      // Send birthday email
      if (member.accepts_email && RESEND_API_KEY && member.email) {
        const memberName = (member.name as string) || 'there';
        const subject = `Happy Birthday from ${businessName}! 🎂 / ¡Feliz Cumpleaños de ${businessName}! 🎂`;

        const html = buildBirthdayEmail(memberName, businessName, BIRTHDAY_BONUS_POINTS, newBalance, MEMBER_APP_URL);

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
          tenant_id: member.tenant_id,
          member_id: member.id,
          channel: 'email',
          type: 'birthday',
          subject,
          status: emailJson.id ? 'sent' : 'failed',
          sent_at: emailJson.id ? now.toISOString() : null,
          data: { bonusPoints: BIRTHDAY_BONUS_POINTS, resendId: emailJson.id },
        });

        if (emailJson.id) totalEmailsSent++;
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
    `birthday-bonus: ${totalBonusAwarded} bonuses, ${totalEmailsSent} emails, ${totalPushSent} push in ${Date.now() - started}ms`
  );

  return new Response(
    JSON.stringify({
      ok: true,
      totalBonusAwarded,
      totalEmailsSent,
      totalPushSent,
      durationMs: Date.now() - started,
      errors,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

function buildBirthdayEmail(
  memberName: string,
  businessName: string,
  bonusPoints: number,
  newBalance: number,
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
          <td style="background-color:#7c3aed; border-radius:12px 12px 0 0; padding:28px 40px; text-align:center;">
            <div style="font-size:40px; margin-bottom:8px;">🎂</div>
            <span style="font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">LoyaltyOS</span>
            <p style="margin:6px 0 0; font-size:13px; color:#ede9fe;">${businessName}</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff; padding:36px 40px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="text-align:right; padding-bottom:12px;"><span style="font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; background:#f1f5f9; border-radius:4px; padding:3px 8px;">EN</span></td></tr>
              <tr><td>
                <h1 style="margin:0 0 16px; font-size:26px; font-weight:800; color:#0f172a;">Happy Birthday, ${memberName}! 🎉</h1>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">On behalf of <strong>${businessName}</strong> and the entire LoyaltyOS team, we want to wish you a wonderful birthday!</p>
                <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:12px; padding:20px 24px; margin:20px 0; text-align:center;">
                  <p style="margin:0 0 8px; font-size:13px; color:#7c3aed; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Birthday Gift 🎁</p>
                  <p style="margin:0; font-size:32px; font-weight:900; color:#7c3aed;">${bonusPoints} bonus points</p>
                  <p style="margin:8px 0 0; font-size:13px; color:#64748b;">Added to your account — new balance: <strong>${newBalance} pts</strong></p>
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="border-radius:8px; background-color:#7c3aed;">
                      <a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Redeem My Points</a>
                    </td>
                  </tr>
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
                <h1 style="margin:0 0 16px; font-size:26px; font-weight:800; color:#0f172a;">¡Feliz Cumpleaños, ${memberName}! 🎉</h1>
                <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">¡De parte de <strong>${businessName}</strong> y todo el equipo de LoyaltyOS, te deseamos un cumpleaños increíble!</p>
                <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:12px; padding:20px 24px; margin:20px 0; text-align:center;">
                  <p style="margin:0 0 8px; font-size:13px; color:#7c3aed; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Regalo de Cumpleaños 🎁</p>
                  <p style="margin:0; font-size:32px; font-weight:900; color:#7c3aed;">${bonusPoints} puntos de regalo</p>
                  <p style="margin:8px 0 0; font-size:13px; color:#64748b;">Agregados a tu cuenta — nuevo saldo: <strong>${newBalance} pts</strong></p>
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="border-radius:8px; background-color:#7c3aed;">
                      <a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Canjear Mis Puntos</a>
                    </td>
                  </tr>
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
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
