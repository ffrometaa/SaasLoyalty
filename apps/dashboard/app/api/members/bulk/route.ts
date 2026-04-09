import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { revalidateTag } from 'next/cache';

// POST /api/members/bulk
// Supported actions:
//   adjust_points — add or subtract points from multiple members
//   quick_blast   — send email and/or push to multiple members
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createServerSupabaseClient();

    const { data: ownerTenant } = await supabase
      .from('tenants')
      .select('id, business_name, brand_color_primary')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    let tenantId: string | null = ownerTenant?.id ?? null;
    let businessName: string = ownerTenant?.business_name ?? 'LoyaltyOS';

    if (!tenantId) {
      const { data: staffRecord } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(business_name)')
        .eq('auth_user_id', user.id)
        .single();
      tenantId = staffRecord?.tenant_id ?? null;
      businessName = (staffRecord?.tenants as { business_name: string } | null)?.business_name ?? 'LoyaltyOS';
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, memberIds } = body;

    if (!action || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'action and memberIds are required' }, { status: 400 });
    }
    if (memberIds.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 members per bulk operation' }, { status: 400 });
    }

    const db = createServiceRoleClient();

    // Security: verify all member IDs belong to this tenant
    const { data: validMembers, error: verifyErr } = await db
      .from('members')
      .select('id, name, email, points_balance, accepts_email, accepts_push')
      .eq('tenant_id', tenantId)
      .in('id', memberIds)
      .is('deleted_at', null);

    if (verifyErr) throw verifyErr;

    const validIds = new Set((validMembers ?? []).map((m: { id: string }) => m.id));
    const members = (validMembers ?? []) as Array<{
      id: string;
      name: string;
      email: string;
      points_balance: number;
      accepts_email: boolean;
      accepts_push: boolean;
    }>;

    if (validIds.size === 0) {
      return NextResponse.json({ error: 'No valid members found' }, { status: 404 });
    }

    // ── Action: adjust_points ──────────────────────────────────────────────────
    if (action === 'adjust_points') {
      const { amount, reason } = body as { amount: number; reason: string };

      if (typeof amount !== 'number' || amount === 0) {
        return NextResponse.json({ error: 'amount must be a non-zero number' }, { status: 400 });
      }
      if (!reason?.trim()) {
        return NextResponse.json({ error: 'reason is required' }, { status: 400 });
      }

      const now = new Date().toISOString();
      let affected = 0;
      const errors: string[] = [];

      for (const member of members) {
        if (!validIds.has(member.id)) continue;

        const newBalance = Math.max(0, member.points_balance + amount);
        const actualDelta = newBalance - member.points_balance;

        const { error: txErr } = await db.from('transactions').insert({
          tenant_id: tenantId,
          member_id: member.id,
          type: 'adjustment',
          points: actualDelta,
          balance_after: newBalance,
          description: reason.trim(),
          reference_id: null,
        });

        if (txErr) { errors.push(`${member.id}: ${txErr.message}`); continue; }

        const { error: upErr } = await db
          .from('members')
          .update({ points_balance: newBalance, updated_at: now })
          .eq('id', member.id);

        if (upErr) { errors.push(`balance ${member.id}: ${upErr.message}`); continue; }

        affected++;
      }

      revalidateTag('members');

      return NextResponse.json({ ok: true, affected, errors });
    }

    // ── Action: quick_blast ────────────────────────────────────────────────────
    if (action === 'quick_blast') {
      const { subject, message, channel } = body as {
        subject: string;
        message: string;
        channel: 'email' | 'push' | 'both';
      };

      if (!subject?.trim() || !message?.trim()) {
        return NextResponse.json({ error: 'subject and message are required' }, { status: 400 });
      }
      if (!['email', 'push', 'both'].includes(channel)) {
        return NextResponse.json({ error: 'channel must be email, push, or both' }, { status: 400 });
      }

      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
      const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

      let emailSent = 0;
      let pushSent = 0;
      const errors: string[] = [];
      const now = new Date().toISOString();

      // Send email
      if ((channel === 'email' || channel === 'both') && RESEND_API_KEY) {
        const emailTargets = members.filter(m => m.accepts_email && m.email);

        for (const member of emailTargets) {
          const html = buildQuickBlastEmail(member.name, businessName, subject.trim(), message.trim());

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: `${businessName} <noreply@loyalbase.dev>`,
              to: [member.email],
              subject: subject.trim(),
              html,
            }),
          });

          const resJson = await res.json() as { id?: string };

          await db.from('notifications').insert({
            tenant_id: tenantId,
            member_id: member.id,
            channel: 'email',
            type: 'custom',
            subject: subject.trim(),
            status: resJson.id ? 'sent' : 'failed',
            sent_at: resJson.id ? now : null,
            data: { resendId: resJson.id, blastSource: 'bulk_action' },
          });

          if (resJson.id) emailSent++;
          else errors.push(`email ${member.id}: failed`);
        }
      }

      // Send push
      if ((channel === 'push' || channel === 'both') && ONESIGNAL_APP_ID && ONESIGNAL_API_KEY) {
        const pushTargets = members.filter(m => m.accepts_push);

        if (pushTargets.length > 0) {
          const res = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${ONESIGNAL_API_KEY}`,
            },
            body: JSON.stringify({
              app_id: ONESIGNAL_APP_ID,
              include_external_user_ids: pushTargets.map(m => m.id),
              headings: { en: subject.trim() },
              contents: { en: message.trim() },
              data: { type: 'custom', blastSource: 'bulk_action' },
            }),
          });

          const resJson = await res.json() as { id?: string; errors?: string[] };

          for (const member of pushTargets) {
            await db.from('notifications').insert({
              tenant_id: tenantId,
              member_id: member.id,
              channel: 'push',
              type: 'custom',
              subject: subject.trim(),
              status: resJson.id ? 'sent' : 'failed',
              sent_at: resJson.id ? now : null,
              data: { onesignalId: resJson.id, blastSource: 'bulk_action' },
            });
          }

          if (resJson.id) pushSent += pushTargets.length;
          else errors.push(`push batch: ${resJson.errors?.join(', ')}`);
        }
      }

      return NextResponse.json({ ok: true, emailSent, pushSent, errors });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('Bulk members API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildQuickBlastEmail(memberName: string, businessName: string, subject: string, message: string): string {
  const safeMessage = message.replace(/\n/g, '<br>');
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
          <td style="background-color:#ffffff; padding:36px 40px; border-radius:0 0 12px 12px;">
            <h1 style="margin:0 0 16px; font-size:22px; font-weight:800; color:#0f172a;">${subject}</h1>
            <p style="margin:0 0 8px; font-size:15px; color:#334155;">Hi ${memberName},</p>
            <p style="margin:0 0 24px; font-size:15px; color:#334155; line-height:1.7;">${safeMessage}</p>
            <p style="margin:0; font-size:13px; color:#94a3b8;">${businessName} · via LoyaltyOS</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
