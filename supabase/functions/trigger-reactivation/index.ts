// Process reactivation sequences
// Runs daily via pg_cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
            <p style="margin:0; font-size:12px; color:#94a3b8;">LoyalBase LLC · St. Petersburg, FL 33702, USA</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const STEP_DAY_OFFSETS: Record<number, number> = { 1: 0, 2: 5, 3: 10, 4: 15 };
const STEP_OFFERS: Record<number, string> = {
  1: 'Come back and earn double points on your next visit',
  2: 'Special offer: 50 bonus points waiting for you',
  3: "Your exclusive offer expires tomorrow — don't miss out!",
  4: 'Last chance to reclaim your loyalty rewards',
};
const REACTIVATION_URL = 'https://app.loyalbase.dev';

serve(async (req: Request) => {
  // Validate CRON_SECRET — all callers must present it as Bearer token
  const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let newSequences = 0;
    let advancedSequences = 0;

    // ── 1. Start new sequences for members inactive 25+ days with no active sequence ──
    const { data: inactiveMembers } = await supabase
      .from('members')
      .select(`
        id, tenant_id, name, email, last_visit_at,
        accepts_email, accepts_push,
        tenants (business_name, brand_color_primary)
      `)
      .eq('status', 'active')
      .lt('last_visit_at', new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString());

    for (const member of inactiveMembers ?? []) {
      const { data: existingSequence } = await supabase
        .from('reactivation_sequences')
        .select('id')
        .eq('member_id', member.id)
        .is('completed_at', null)
        .is('cancelled_at', null)
        .maybeSingle();

      if (existingSequence) continue;

      const { error: seqErr } = await supabase
        .from('reactivation_sequences')
        .insert({ tenant_id: member.tenant_id, member_id: member.id, current_step: 1 });

      if (seqErr) { console.error('Error creating sequence:', seqErr); continue; }

      await sendReactivationEmail(supabase, member, 1);
      await sendReactivationPush(supabase, member, 1);
      newSequences++;
    }

    // ── 2. Advance existing active sequences (steps 2 → 3 → 4) ──
    const { data: activeSequences } = await supabase
      .from('reactivation_sequences')
      .select('id, member_id, tenant_id, current_step, created_at')
      .is('completed_at', null)
      .is('cancelled_at', null)
      .lt('current_step', 4);

    for (const seq of activeSequences ?? []) {
      const nextStep = seq.current_step + 1;
      const daysRequired = STEP_DAY_OFFSETS[nextStep];
      const readyAt = new Date(seq.created_at).getTime() + daysRequired * 24 * 60 * 60 * 1000;
      if (Date.now() < readyAt) continue;

      const { data: memberData } = await supabase
        .from('members')
        .select(`
          id, tenant_id, name, email, last_visit_at,
          accepts_email, accepts_push,
          tenants (business_name, brand_color_primary)
        `)
        .eq('id', seq.member_id)
        .single();

      if (!memberData) continue;

      // Cancel if the member has visited since the sequence started
      if (memberData.last_visit_at && new Date(memberData.last_visit_at) > new Date(seq.created_at)) {
        await supabase
          .from('reactivation_sequences')
          .update({ cancelled_at: new Date().toISOString() })
          .eq('id', seq.id);
        continue;
      }

      const isLastStep = nextStep === 4;
      await supabase
        .from('reactivation_sequences')
        .update({
          current_step: nextStep,
          ...(isLastStep ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq('id', seq.id);

      await sendReactivationEmail(supabase, memberData, nextStep);
      await sendReactivationPush(supabase, memberData, nextStep);
      advancedSequences++;
    }

    console.log(`Reactivation: ${newSequences} new sequences, ${advancedSequences} advanced`);
    return new Response(JSON.stringify({ newSequences, advancedSequences }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in reactivation job:', err);
    return new Response('Job failed', { status: 500 });
  }
});

async function sendReactivationEmail(supabase: SupabaseClient, member: Record<string, unknown>, step: number) {
  if (!member.accepts_email) return;

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) { console.error('RESEND_API_KEY not configured'); return; }

  const FROM_EMAIL = 'LoyaltyOS <hello@loyalbase.dev>';
  const tenants = member.tenants as Record<string, string> | null;
  const businessName = tenants?.business_name || 'your loyalty program';
  const daysSinceVisit = 25 + STEP_DAY_OFFSETS[step];
  const offer = STEP_OFFERS[step] || STEP_OFFERS[1];
  const memberName = (member.name as string) || 'there';

  const enHtmlContent = `
    <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">We miss you! 💜</h1>
    <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Hi <strong>${memberName}</strong>, it's been ${daysSinceVisit} days since your last visit to <strong>${businessName}</strong>.</p>
    ${emailHighlight(`<strong>Special offer just for you:</strong><br>${offer}`)}
    <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Come back and enjoy your loyalty rewards. Your points are waiting!</p>
    ${emailButton('See My Rewards', REACTIVATION_URL)}
    <p style="margin:0; font-size:13px; color:#64748b;">This offer is exclusively for loyal members like you.</p>
  `;

  const esHtmlContent = `
    <h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:#0f172a;">¡Te extrañamos! 💜</h1>
    <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Hola <strong>${memberName}</strong>, pasaron ${daysSinceVisit} días desde tu última visita a <strong>${businessName}</strong>.</p>
    ${emailHighlight(`<strong>Oferta especial solo para vos:</strong><br>${offer}`)}
    <p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">Volvé y disfrutá de tus recompensas de fidelización. ¡Tus puntos te esperan!</p>
    ${emailButton('Ver Mis Recompensas', REACTIVATION_URL)}
    <p style="margin:0; font-size:13px; color:#64748b;">Esta oferta es exclusiva para miembros fieles como vos.</p>
  `;

  const html = buildBilingualHtml(enHtmlContent, esHtmlContent, businessName);
  const subject = `We miss you at ${businessName} / Te extrañamos en ${businessName}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: [member.email as string], subject, html }),
  });

  const resJson = await res.json() as { id?: string };

  await supabase.from('notifications').insert({
    tenant_id: member.tenant_id,
    member_id: member.id,
    channel: 'email',
    type: 'reactivation',
    subject,
    status: resJson.id ? 'sent' : 'failed',
    sent_at: resJson.id ? new Date().toISOString() : null,
    data: { step, resendId: resJson.id },
  });
}

async function sendReactivationPush(supabase: SupabaseClient, member: Record<string, unknown>, step: number) {
  if (!member.accepts_push) return;

  const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
  const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY');
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) return;

  const tenants = member.tenants as Record<string, string> | null;
  const businessName = tenants?.business_name || 'your program';
  const offer = STEP_OFFERS[step] || STEP_OFFERS[1];

  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${ONESIGNAL_API_KEY}` },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [member.id as string],
      headings: { en: `${businessName} misses you 💜` },
      contents: { en: offer },
      data: { type: 'reactivation', step },
      url: REACTIVATION_URL,
    }),
  });

  const resJson = await res.json() as { id?: string; errors?: string[] };

  await supabase.from('notifications').insert({
    tenant_id: member.tenant_id,
    member_id: member.id,
    channel: 'push',
    type: 'reactivation',
    subject: `${businessName} misses you`,
    status: resJson.id ? 'sent' : 'failed',
    sent_at: resJson.id ? new Date().toISOString() : null,
    data: { step, onesignalId: resJson.id, errors: resJson.errors },
  });
}
