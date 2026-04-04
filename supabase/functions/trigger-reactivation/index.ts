// Process reactivation sequences
// Runs daily via pg_cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Note: Cannot import from @loyalty-os/email in Deno edge functions.
// Template helpers are inlined below.

function emailButton(text: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px; background-color:#7c3aed;">
        <a href="${url}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function emailHighlight(text: string) {
  return `<div style="background:#7c3aed18; border:1px solid #7c3aed40; border-radius:8px; padding:16px 20px; margin:16px 0;">
    <p style="margin:0; font-size:15px; color:#0f172a;">${text}</p>
  </div>`;
}

function buildBilingualHtml(enHtmlContent: string, esHtmlContent: string, tenantName?: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
        <tr>
          <td style="background-color:#ffffff; border-radius:12px 12px 0 0; padding:28px 40px; text-align:center; border-bottom:1px solid #e2e8f0;">
            <span style="font-size:22px; font-weight:800; color:#7c3aed; letter-spacing:-0.5px;">LoyaltyOS</span>
            ${tenantName ? `<p style="margin:6px 0 0; font-size:13px; color:#64748b;">${tenantName}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff; padding:36px 40px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="text-align:right; padding-bottom:12px;"><span style="font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; background:#f1f5f9; border-radius:4px; padding:3px 8px;">EN</span></td></tr>
              <tr><td style="color:#0f172a; font-size:15px; line-height:1.7;">${enHtmlContent}</td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="background-color:#ffffff; padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;"></td></tr></table></td></tr>
        <tr>
          <td style="background-color:#ffffff; padding:28px 40px 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="text-align:right; padding-bottom:12px;"><span style="font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; background:#f1f5f9; border-radius:4px; padding:3px 8px;">ES</span></td></tr>
              <tr><td style="color:#0f172a; font-size:15px; line-height:1.7;">${esHtmlContent}</td></tr>
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
            <p style="margin:0; font-size:12px; color:#94a3b8;">LoyaltyOS LLC · West Palm Beach, FL, USA</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: inactiveMembers } = await supabase
      .from('members')
      .select(`
        id,
        tenant_id,
        name,
        email,
        last_visit_at,
        accepts_email,
        tenants (business_name, brand_color_primary)
      `)
      .eq('status', 'active')
      .eq('accepts_email', true)
      .lt('last_visit_at', new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString());

    if (!inactiveMembers || inactiveMembers.length === 0) {
      console.log('No inactive members found for reactivation');
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;

    for (const member of inactiveMembers) {
      const { data: existingSequence } = await supabase
        .from('reactivation_sequences')
        .select('id')
        .eq('member_id', member.id)
        .is('completed_at', null)
        .is('cancelled_at', null)
        .single();

      if (existingSequence) continue;

      const { error: sequenceError } = await supabase
        .from('reactivation_sequences')
        .insert({
          tenant_id: member.tenant_id,
          member_id: member.id,
          current_step: 1,
        });

      if (sequenceError) {
        console.error('Error creating sequence:', sequenceError);
        continue;
      }

      await sendReactivationEmail(supabase, member, 1);
      processed++;
    }

    console.log(`Processed ${processed} members for reactivation`);
    return new Response(JSON.stringify({ processed }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in reactivation job:', err);
    return new Response('Job failed', { status: 500 });
  }
});

async function sendReactivationEmail(supabase: any, member: any, step: number) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured — skipping reactivation email');
    return;
  }

  // From address should match tenant custom domain when available for better deliverability.
  const FROM_EMAIL = 'LoyaltyOS <hello@loyalbase.dev>';

  const businessName = member.tenants?.business_name || 'your loyalty program';
  const daysSinceVisit = step === 1 ? 25 : step === 2 ? 30 : step === 3 ? 35 : 40;

  const stepOffers: Record<number, string> = {
    1: 'Come back and earn double points on your next visit',
    2: 'Special offer: 50 bonus points waiting for you',
    3: "Your exclusive offer expires tomorrow — don't miss out!",
    4: 'Last chance to reclaim your loyalty rewards',
  };

  const rewardsUrl = 'https://app.loyalbase.dev';
  const offer = stepOffers[step] || stepOffers[1];

  const enHtmlContent = `
    <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">We miss you! 💜</h1>
    <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Hi <strong>${member.name || 'there'}</strong>, it's been ${daysSinceVisit} days since your last visit to <strong>${businessName}</strong>.</p>
    ${emailHighlight(`<strong>Special offer just for you:</strong><br>${offer}`)}
    <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Come back and enjoy your loyalty rewards. Your points are waiting!</p>
    ${emailButton('See My Rewards', rewardsUrl)}
    <p style="margin:0; font-size:13px; color:#64748b;">This offer is exclusively for loyal members like you.</p>
  `;

  const esHtmlContent = `
    <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">¡Te extrañamos! 💜</h1>
    <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Hola <strong>${member.name || 'ahí'}</strong>, pasaron ${daysSinceVisit} días desde tu última visita a <strong>${businessName}</strong>.</p>
    ${emailHighlight(`<strong>Oferta especial solo para vos:</strong><br>${offer}`)}
    <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Volvé y disfrutá de tus recompensas de fidelización. ¡Tus puntos te esperan!</p>
    ${emailButton('Ver Mis Recompensas', rewardsUrl)}
    <p style="margin:0; font-size:13px; color:#64748b;">Esta oferta es exclusiva para miembros fieles como vos.</p>
  `;

  const html = buildBilingualHtml(enHtmlContent, esHtmlContent, businessName);
  const subject = `We miss you at ${businessName} / Te extrañamos en ${businessName}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [member.email],
      subject,
      html,
    }),
  });

  const resJson = await res.json();
  const emailId = (resJson as any).id || null;

  await supabase.from('notifications').insert({
    tenant_id: member.tenant_id,
    member_id: member.id,
    channel: 'email',
    type: 'reactivation',
    subject,
    status: emailId ? 'sent' : 'failed',
    sent_at: emailId ? new Date().toISOString() : null,
    data: { step, resendId: emailId },
  });

  if (!emailId) {
    console.error(`Reactivation email failed for ${member.email}:`, resJson);
  } else {
    console.log(`Reactivation step ${step} sent to ${member.email}`);
  }
}
