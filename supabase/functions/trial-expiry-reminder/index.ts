// Send trial expiry reminder emails to tenants whose trial ends in 3 days.
// Runs daily at 10:00 UTC via pg_cron.
//
// Logic:
//   Find all tenants in 'trialing' status whose trial_ends_at::date = today + 3 days.
//   Send email via Resend using bilingual (EN + ES) content.
//
// Idempotency: the query is date-exact — runs once per day, matches once per tenant.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

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
  const DAYS_LEFT = 3;

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, business_name, owner_email')
    .eq('plan_status', 'trialing')
    .is('deleted_at', null)
    .filter('trial_ends_at::date', 'eq', `now() + interval '${DAYS_LEFT} days'`);

  if (error) {
    console.error('trial-expiry-reminder query error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!tenants || tenants.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, durationMs: Date.now() - started }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let sent = 0;
  const errors: string[] = [];

  for (const tenant of tenants) {
    if (!tenant.owner_email) continue;

    const { subject, html } = buildTrialExpiryEmail({
      businessName: tenant.business_name,
      daysLeft: DAYS_LEFT,
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

    if (res.ok) {
      sent++;
    } else {
      const body = await res.text();
      errors.push(`${tenant.id}: ${body}`);
    }
  }

  console.log(`trial-expiry-reminder: ${sent}/${tenants.length} emails sent in ${Date.now() - started}ms`);

  return new Response(
    JSON.stringify({ ok: true, sent, total: tenants.length, durationMs: Date.now() - started, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

function buildTrialExpiryEmail({ businessName = '', daysLeft = 3 }): { subject: string; html: string } {
  const enSubject = `Your LoyaltyOS trial ends in ${daysLeft} days`;
  const esSubject = `Tu período de prueba de LoyaltyOS termina en ${daysLeft} días`;
  const subject = `${enSubject} / ${esSubject}`;

  const billingUrl = 'https://dashboard.loyalbase.dev/settings/billing';

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
            <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">Your trial ends in ${daysLeft} days ⏰</h1>
            <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">
              Hi <strong>${businessName}</strong>, your LoyaltyOS trial ends in <strong>${daysLeft} days</strong>.
              Add a payment method now to keep all your data and continue serving your members.
            </p>
            <div style="background:#faf5ff; border:1px solid #ddd6fe; border-radius:10px; padding:16px 20px; margin:0 0 20px;">
              <p style="margin:0 0 8px; font-size:13px; font-weight:700; color:#7c3aed;">Without a paid plan you will lose access to:</p>
              <ul style="margin:0; padding-left:20px; color:#334155; font-size:14px; line-height:2;">
                <li>Member management and points tracking</li>
                <li>Rewards and redemption system</li>
                <li>Campaign sending</li>
                <li>Analytics and insights</li>
              </ul>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="border-radius:8px; background:linear-gradient(135deg,#7c3aed,#2563eb);">
                  <a href="${billingUrl}" style="display:inline-block; padding:13px 28px; color:#fff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Add Payment Method</a>
                </td>
              </tr>
            </table>

            <hr style="border:none; border-top:1px solid #e2e8f0; margin:0 0 28px;" />

            <!-- ES -->
            <p style="margin:0 0 4px; font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase;">ES</p>
            <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">Tu trial termina en ${daysLeft} días ⏰</h1>
            <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">
              Hola <strong>${businessName}</strong>, tu período de prueba de LoyaltyOS termina en <strong>${daysLeft} días</strong>.
              Agregá un método de pago ahora para conservar todos tus datos y seguir atendiendo a tus miembros.
            </p>
            <div style="background:#faf5ff; border:1px solid #ddd6fe; border-radius:10px; padding:16px 20px; margin:0 0 20px;">
              <p style="margin:0 0 8px; font-size:13px; font-weight:700; color:#7c3aed;">Sin un plan pago perderás acceso a:</p>
              <ul style="margin:0; padding-left:20px; color:#334155; font-size:14px; line-height:2;">
                <li>Gestión de miembros y seguimiento de puntos</li>
                <li>Sistema de recompensas y canje</li>
                <li>Envío de campañas</li>
                <li>Analytics e informes</li>
              </ul>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px; background:linear-gradient(135deg,#7c3aed,#2563eb);">
                  <a href="${billingUrl}" style="display:inline-block; padding:13px 28px; color:#fff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">Agregar Método de Pago</a>
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
