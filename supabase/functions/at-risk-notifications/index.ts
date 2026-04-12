// Deliver pending churn interventions as push + email notifications
// Runs weekly (Sunday 22:00 UTC) via pg_cron
//
// The run-scoring-engine creates churn_interventions with status='pending'
// for members with churn_score >= 0.6. This function picks them up and delivers them.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY') ?? '';
const MEMBER_APP_URL = Deno.env.get('MEMBER_APP_URL') ?? 'https://app.loyalbase.dev';

const INTERVENTION_COPY: Record<string, { heading: string; body: string; headingEs: string; bodyEs: string }> = {
  win_back_campaign: {
    heading: "We really miss you 💜",
    body: "It's been a while. Come back and we'll give you a special bonus on your next visit.",
    headingEs: "¡Te extrañamos mucho! 💜",
    bodyEs: "Pasó bastante tiempo. Volvé y te damos un bonus especial en tu próxima visita.",
  },
  bonus_offer: {
    heading: "A special offer just for you 🎁",
    body: "Earn double points on your next visit. Limited time — don't miss out!",
    headingEs: "Una oferta especial solo para vos 🎁",
    bodyEs: "Ganás el doble de puntos en tu próxima visita. ¡Por tiempo limitado!",
  },
  personal_challenge: {
    heading: "New challenge waiting for you 🏆",
    body: "You have a personalized challenge ready. Complete it and earn bonus points!",
    headingEs: "¡Nuevo desafío te espera! 🏆",
    bodyEs: "Tenés un desafío personalizado listo. ¡Completalo y ganás puntos extra!",
  },
  tier_reminder: {
    heading: "Your rewards are waiting 🌟",
    body: "Don't let your loyalty points go to waste — come visit us soon!",
    headingEs: "Tus recompensas te esperan 🌟",
    bodyEs: "No dejes que tus puntos de fidelización se pierdan. ¡Visitanos pronto!",
  },
};

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
  const now = new Date().toISOString();
  let delivered = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // Fetch pending interventions with member + tenant info
    const { data: interventions, error: intErr } = await supabase
      .from('churn_interventions')
      .select(`
        id, member_id, tenant_id, intervention_type, churn_score,
        members (name, email, accepts_email, accepts_push),
        tenants (business_name, brand_color_primary)
      `)
      .eq('status', 'pending')
      .order('churn_score', { ascending: false })
      .limit(500);

    if (intErr) throw intErr;

    for (const intervention of interventions ?? []) {
      const member = intervention.members as Record<string, unknown> | null;
      const tenant = intervention.tenants as Record<string, unknown> | null;

      if (!member || !tenant) { skipped++; continue; }

      const copy = INTERVENTION_COPY[intervention.intervention_type] ?? INTERVENTION_COPY.tier_reminder;
      const businessName = (tenant.business_name as string) || 'LoyaltyOS';
      const memberName = (member.name as string) || 'there';
      const memberEmail = member.email as string;
      let notified = false;

      // Push notification
      if (member.accepts_push && ONESIGNAL_APP_ID && ONESIGNAL_API_KEY) {
        const res = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Basic ${ONESIGNAL_API_KEY}` },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: [intervention.member_id],
            headings: { en: copy.heading },
            contents: { en: copy.body },
            data: { type: 'at_risk', interventionType: intervention.intervention_type },
            url: MEMBER_APP_URL,
          }),
        });
        const resJson = await res.json() as { id?: string };

        await supabase.from('notifications').insert({
          tenant_id: intervention.tenant_id,
          member_id: intervention.member_id,
          channel: 'push',
          type: 'at_risk',
          subject: copy.heading,
          status: resJson.id ? 'sent' : 'failed',
          sent_at: resJson.id ? now : null,
          data: { interventionType: intervention.intervention_type, onesignalId: resJson.id },
        });

        if (resJson.id) notified = true;
      }

      // Email
      if (member.accepts_email && RESEND_API_KEY && memberEmail) {
        const html = buildAtRiskEmail(memberName, businessName, copy, MEMBER_APP_URL);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: `${businessName} via LoyaltyOS <noreply@loyalbase.dev>`,
            to: [memberEmail],
            subject: `${copy.heading} / ${copy.headingEs}`,
            html,
          }),
        });
        const resJson = await res.json() as { id?: string };

        await supabase.from('notifications').insert({
          tenant_id: intervention.tenant_id,
          member_id: intervention.member_id,
          channel: 'email',
          type: 'at_risk',
          subject: copy.heading,
          status: resJson.id ? 'sent' : 'failed',
          sent_at: resJson.id ? now : null,
          data: { interventionType: intervention.intervention_type, resendId: resJson.id },
        });

        if (resJson.id) notified = true;
      }

      // Mark intervention as sent (or skip if no channel available)
      if (notified || (!member.accepts_email && !member.accepts_push)) {
        await supabase
          .from('churn_interventions')
          .update({ status: 'sent' })
          .eq('id', intervention.id);
        delivered++;
      } else {
        skipped++;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`at-risk-notifications: ${delivered} delivered, ${skipped} skipped in ${Date.now() - started}ms`);
  return new Response(
    JSON.stringify({ ok: true, delivered, skipped, durationMs: Date.now() - started, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

function buildAtRiskEmail(
  memberName: string,
  businessName: string,
  copy: { heading: string; body: string; headingEs: string; bodyEs: string },
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
            <span style="font-size:22px; font-weight:800; color:#ffffff;">${businessName}</span>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff; padding:36px 40px; border-radius:0 0 0 0;">
            <p style="margin:0 0 6px; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">EN</p>
            <h1 style="margin:0 0 12px; font-size:22px; font-weight:800; color:#0f172a;">${copy.heading}</h1>
            <p style="margin:0 0 8px; font-size:15px; color:#334155;">Hi <strong>${memberName}</strong>,</p>
            <p style="margin:0 0 24px; font-size:15px; color:#334155; line-height:1.7;">${copy.body}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr><td style="border-radius:8px; background-color:#7c3aed;">
                <a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">See My Rewards</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="background-color:#ffffff; padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;"></td></tr></table></td></tr>
        <tr>
          <td style="background-color:#ffffff; padding:28px 40px 36px; border-radius:0 0 12px 12px;">
            <p style="margin:0 0 6px; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">ES</p>
            <h1 style="margin:0 0 12px; font-size:22px; font-weight:800; color:#0f172a;">${copy.headingEs}</h1>
            <p style="margin:0 0 8px; font-size:15px; color:#334155;">Hola <strong>${memberName}</strong>,</p>
            <p style="margin:0 0 24px; font-size:15px; color:#334155; line-height:1.7;">${copy.bodyEs}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr><td style="border-radius:8px; background-color:#7c3aed;">
                <a href="${appUrl}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Ver Mis Recompensas</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f1f5f9; border-radius:0 0 12px 12px; padding:20px 40px; border-top:1px solid #e2e8f0; text-align:center;">
            <p style="margin:0; font-size:12px; color:#94a3b8;">LoyalBase LLC · St. Petersburg, FL 33702, USA</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
