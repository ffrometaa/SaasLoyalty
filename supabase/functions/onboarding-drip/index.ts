// Send onboarding drip emails to trialing tenants.
// Runs daily at 10:30 UTC via pg_cron.
//
// Logic:
//   day3: tenant created 3–4 days ago, no 'day3' row in tenant_drip_emails → send day-3 email
//   day7: tenant created 7–8 days ago, no 'day7' row in tenant_drip_emails → send day-7 email
//
// Idempotency: UNIQUE(tenant_id, email_key) in tenant_drip_emails — INSERT ON CONFLICT DO NOTHING.
// Error isolation: one tenant failure does not stop the rest.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const DASHBOARD_URL = Deno.env.get('DASHBOARD_URL') ?? 'https://dashboard.loyalbase.dev';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const started = Date.now();

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, business_name, owner_email, created_at, trial_ends_at')
    .eq('plan_status', 'trialing')
    .is('deleted_at', null);

  if (error) {
    console.error('onboarding-drip query error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!tenants || tenants.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, total: 0, durationMs: Date.now() - started }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let sent = 0;
  const errors: string[] = [];
  const now = Date.now();

  for (const tenant of tenants) {
    if (!tenant.owner_email) continue;

    try {
      const daysSinceCreated = (now - new Date(tenant.created_at).getTime()) / 86_400_000;
      const businessName = tenant.business_name ?? '';
      const rewardsUrl = `${DASHBOARD_URL}/rewards`;

      let emailKey: 'day3' | 'day7' | null = null;

      if (daysSinceCreated >= 3 && daysSinceCreated < 4) {
        emailKey = 'day3';
      } else if (daysSinceCreated >= 7 && daysSinceCreated < 8) {
        emailKey = 'day7';
      }

      if (!emailKey) continue;

      // Idempotency: check if already sent
      const { data: existing } = await supabase
        .from('tenant_drip_emails')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('email_key', emailKey)
        .maybeSingle();

      if (existing) continue;

      // Build email inline (Deno can't import TS monorepo packages)
      const { subject, html } = emailKey === 'day3'
        ? buildDay3Email({ businessName, dashboardUrl: DASHBOARD_URL, rewardsUrl })
        : buildDay7Email({
            businessName,
            dashboardUrl: DASHBOARD_URL,
            upgradeUrl: `${DASHBOARD_URL}/settings?tab=billing`,
            daysLeft: tenant.trial_ends_at
              ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - now) / 86_400_000))
              : 7,
          });

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'LoyaltyOS <hello@loyalbase.dev>',
          to: [tenant.owner_email],
          subject,
          html,
        }),
      });

      let resendId: string | null = null;
      if (res.ok) {
        const resendBody = await res.json().catch(() => ({}));
        resendId = resendBody?.id ?? null;

        // INSERT idempotency record — ON CONFLICT DO NOTHING via unique constraint
        await supabase
          .from('tenant_drip_emails')
          .insert({ tenant_id: tenant.id, email_key: emailKey, resend_id: resendId })
          .select();

        sent++;
      } else {
        const body = await res.text();
        errors.push(`${tenant.id} (${emailKey}): ${body}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${tenant.id}: ${message}`);
    }
  }

  console.log(`onboarding-drip: ${sent}/${tenants.length} emails sent in ${Date.now() - started}ms`);

  return new Response(
    JSON.stringify({ ok: true, sent, total: tenants.length, durationMs: Date.now() - started, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

// ─── INLINE EMAIL BUILDERS ────────────────────────────────────────────────────
// Mirrors packages/email/src/templates/onboarding-day3.ts and onboarding-day7.ts
// Deno edge functions cannot import from the TS monorepo.

function buildDay3Email({
  businessName = '',
  dashboardUrl = '',
  rewardsUrl = '',
}: { businessName: string; dashboardUrl: string; rewardsUrl: string }) {
  const enSubject = `Day 3 check-in — have you created your first reward?`;
  const esSubject = `Día 3 — ¿Ya creaste tu primera recompensa?`;
  const subject = `${enSubject} / ${esSubject}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#2563eb); border-radius:12px 12px 0 0; padding:28px 40px; text-align:center;">
            <span style="font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.5px;">LoyaltyOS</span>
          </td>
        </tr>
        <tr>
          <td style="background:#fff; padding:36px 40px 28px;">
            <!-- EN -->
            <p style="margin:0 0 4px; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase;">EN</p>
            <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">How's it going, ${businessName}? 👋</h1>
            <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">
              It's been 3 days since you joined LoyaltyOS. Have you set up your first reward yet?
            </p>
            <div style="background:#faf5ff; border:1px solid #ddd6fe; border-radius:10px; padding:16px 20px; margin:0 0 20px;">
              <p style="margin:0; font-size:15px; color:#0f172a;">
                Creating a reward is the most important step to getting your loyalty program running. It only takes 2 minutes.
              </p>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
              <tr>
                <td style="border-radius:8px; background:linear-gradient(135deg,#7c3aed,#2563eb);">
                  <a href="${rewardsUrl}" style="display:inline-block; padding:13px 28px; color:#fff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Create Your First Reward →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 32px; font-size:13px; color:#64748b;">
              Need help? Visit your <a href="${dashboardUrl}" style="color:#4f46e5;">dashboard</a> or reply to this email.
            </p>

            <hr style="border:none; border-top:1px solid #e2e8f0; margin:0 0 28px;" />

            <!-- ES -->
            <p style="margin:0 0 4px; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase;">ES</p>
            <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">¿Cómo va todo, ${businessName}? 👋</h1>
            <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">
              Hace 3 días que te uniste a LoyaltyOS. ¿Ya configuraste tu primera recompensa?
            </p>
            <div style="background:#faf5ff; border:1px solid #ddd6fe; border-radius:10px; padding:16px 20px; margin:0 0 20px;">
              <p style="margin:0; font-size:15px; color:#0f172a;">
                Crear una recompensa es el paso más importante. Solo lleva 2 minutos.
              </p>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px; background:linear-gradient(135deg,#7c3aed,#2563eb);">
                  <a href="${rewardsUrl}" style="display:inline-block; padding:13px 28px; color:#fff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Crear tu Primera Recompensa →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f1f5f9; border-radius:0 0 12px 12px; padding:20px 40px; border-top:1px solid #e2e8f0; text-align:center;">
            <p style="margin:0; font-size:12px; color:#94a3b8;">LoyalBase LLC · St. Petersburg, FL 33702, USA</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

function buildDay7Email({
  businessName = '',
  dashboardUrl = '',
  daysLeft = 7,
  upgradeUrl = '',
}: { businessName: string; dashboardUrl: string; daysLeft: number; upgradeUrl: string }) {
  const enSubject = `Day 7 — ${daysLeft} days left in your trial`;
  const esSubject = `Día 7 — te quedan ${daysLeft} días de prueba`;
  const subject = `${enSubject} / ${esSubject}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#2563eb); border-radius:12px 12px 0 0; padding:28px 40px; text-align:center;">
            <span style="font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.5px;">LoyaltyOS</span>
          </td>
        </tr>
        <tr>
          <td style="background:#fff; padding:36px 40px 28px;">
            <!-- EN -->
            <p style="margin:0 0 4px; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase;">EN</p>
            <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">One week in — great progress, ${businessName}! 🚀</h1>
            <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">
              You have <strong>${daysLeft} days left</strong> in your trial. Upgrade now to keep all your data.
            </p>
            <div style="background:#faf5ff; border:1px solid #ddd6fe; border-radius:10px; padding:16px 20px; margin:0 0 20px;">
              <p style="margin:0 0 8px; font-size:13px; font-weight:700; color:#7c3aed;">Quick checklist before trial ends:</p>
              <ul style="margin:0; padding-left:20px; color:#334155; font-size:14px; line-height:2;">
                <li>Create at least one reward your customers will love</li>
                <li>Invite your first members to join the program</li>
                <li>Share a reward link on social media</li>
              </ul>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
              <tr>
                <td style="border-radius:8px; background:linear-gradient(135deg,#7c3aed,#2563eb);">
                  <a href="${upgradeUrl}" style="display:inline-block; padding:13px 28px; color:#fff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Upgrade Before Trial Ends →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 32px; font-size:13px; color:#64748b;">
              Questions? Visit your <a href="${dashboardUrl}" style="color:#4f46e5;">dashboard</a> or reply to this email.
            </p>

            <hr style="border:none; border-top:1px solid #e2e8f0; margin:0 0 28px;" />

            <!-- ES -->
            <p style="margin:0 0 4px; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase;">ES</p>
            <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">Una semana adentro — ¡gran progreso, ${businessName}! 🚀</h1>
            <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">
              Te quedan <strong>${daysLeft} días</strong> de trial. Actualizá ahora para conservar todos tus datos.
            </p>
            <div style="background:#faf5ff; border:1px solid #ddd6fe; border-radius:10px; padding:16px 20px; margin:0 0 20px;">
              <p style="margin:0 0 8px; font-size:13px; font-weight:700; color:#7c3aed;">Checklist antes de que termine el trial:</p>
              <ul style="margin:0; padding-left:20px; color:#334155; font-size:14px; line-height:2;">
                <li>Creá al menos una recompensa que tus clientes amen</li>
                <li>Invitá a tus primeros miembros al programa</li>
                <li>Compartí un enlace de recompensa en redes sociales</li>
              </ul>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px; background:linear-gradient(135deg,#7c3aed,#2563eb);">
                  <a href="${upgradeUrl}" style="display:inline-block; padding:13px 28px; color:#fff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Actualizá Antes del Final del Trial →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f1f5f9; border-radius:0 0 12px 12px; padding:20px 40px; border-top:1px solid #e2e8f0; text-align:center;">
            <p style="margin:0; font-size:12px; color:#94a3b8;">LoyalBase LLC · St. Petersburg, FL 33702, USA</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
