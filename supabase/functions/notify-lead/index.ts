// Triggered by Supabase Database Webhook on INSERT to demo_requests
// Sends an email notification to the owner with the lead details

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const OWNER_EMAIL = Deno.env.get('LEAD_NOTIFICATION_EMAIL') ?? 'felixdfrometa@gmail.com';



serve(async (req) => {
  try {
    if (!RESEND_API_KEY || !OWNER_EMAIL) {
      console.error('Missing environment variables: RESEND_API_KEY or LEAD_NOTIFICATION_EMAIL');
      return new Response('Server misconfiguration', { status: 500 });
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response('Invalid content type', { status: 400 });
    }

    const payload = await req.json();

    if (!payload.type || !payload.record) {
      return new Response('Invalid webhook payload', { status: 400 });
    }

    if (payload.type !== 'INSERT') {
      return new Response('Only INSERT events are handled', { status: 200 });
    }

    const record = payload.record;
    if (!record) {
      return new Response('No record in payload', { status: 400 });
    }

    const {
      business_name,
      business_type,
      owner_name,
      email,
      phone,
      message,
      created_at,
    } = record;

    const formattedDate = new Date(created_at).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [OWNER_EMAIL],
        subject: `🔥 Nuevo lead: ${business_name} (${business_type})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #7c3aed, #2563eb); padding: 24px 32px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🔥 Nuevo lead en LoyaltyOS</h1>
              <p style="margin: 6px 0 0; opacity: 0.8; font-size: 14px;">${formattedDate}</p>
            </div>

            <div style="padding: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px; width: 140px;">Negocio</td>
                  <td style="padding: 10px 0; font-weight: 600; font-size: 15px;">${business_name}</td>
                </tr>
                <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                  <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Tipo</td>
                  <td style="padding: 10px 0;">${business_type}</td>
                </tr>
                <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                  <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Contacto</td>
                  <td style="padding: 10px 0; font-weight: 600;">${owner_name}</td>
                </tr>
                <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                  <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Email</td>
                  <td style="padding: 10px 0;">
                    <a href="mailto:${email}" style="color: #a78bfa; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                ${phone ? `
                <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                  <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Teléfono</td>
                  <td style="padding: 10px 0;">
                    <a href="tel:${phone}" style="color: #a78bfa; text-decoration: none;">${phone}</a>
                  </td>
                </tr>
                ` : ''}
                ${message ? `
                <tr style="border-top: 1px solid rgba(255,255,255,0.07);">
                  <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px; vertical-align: top;">Mensaje</td>
                  <td style="padding: 10px 0; color: rgba(255,255,255,0.8); font-style: italic;">"${message}"</td>
                </tr>
                ` : ''}
              </table>

              <div style="margin-top: 28px; padding: 16px; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); border-radius: 8px; font-size: 13px; color: rgba(255,255,255,0.7);">
                💡 Contactalos dentro de las primeras 24 horas — la tasa de conversión cae un 80% después de ese tiempo.
              </div>

              <a href="mailto:${email}?subject=Demo LoyaltyOS para ${encodeURIComponent(business_name)}" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Responder a ${owner_name} →
              </a>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Resend error:', error);
      return new Response(`Resend error: ${error}`, { status: 500 });
    }

    console.log(`Lead notification sent for ${business_name} (${email})`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-lead error:', err);
    return new Response(`Error: ${err}`, { status: 500 });
  }
});
