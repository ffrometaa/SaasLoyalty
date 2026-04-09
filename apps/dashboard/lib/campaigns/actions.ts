'use server';

import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { requireCampaignSlot } from '../plans/guardFeature';
import { getMemberIdsForSegment, isValidSegment, isCustomSegmentId } from './segments';
import { revalidatePath } from 'next/cache';
import type { Plan } from '../plans/features';
import { buildBilingualEmail, buildCampaignEmail } from '@loyalty-os/email';

// ─── AUTH HELPER ─────────────────────────────────────────────────────────────

async function resolveAuthedTenant(): Promise<{ tenantId: string; userId: string; plan: Plan } | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await (supabase.auth as { getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }> }).getSession();
  if (!session?.user) return null;

  const { data: ownerTenant } = await supabase
    .from('tenants')
    .select('id, plan')
    .eq('auth_user_id', session.user.id)
    .is('deleted_at', null)
    .single();

  if (ownerTenant?.id) {
    return { tenantId: ownerTenant.id, userId: session.user.id, plan: ownerTenant.plan as Plan };
  }

  const { data: staffRecord } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(plan)')
    .eq('auth_user_id', session.user.id)
    .single();

  if (staffRecord?.tenant_id) {
    const plan = (staffRecord.tenants as { plan: string } | null)?.plan ?? 'starter';
    return { tenantId: staffRecord.tenant_id, userId: session.user.id, plan: plan as Plan };
  }

  return null;
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

function validateCampaignInput(input: {
  name: string;
  body: string;
  body_en: string | null;
  body_es: string | null;
  subject_es?: string | null;
  type: string;
  subject: string | null;
  segment: string;
  [key: string]: unknown;
}): string | null {
  if (!input.name || input.name.trim() === '') return 'Campaign name is required.';
  if (input.type === 'email') {
    const hasEn = input.body_en && input.body_en.trim() !== '';
    const hasEs = input.body_es && input.body_es.trim() !== '';
    if (!hasEn && !hasEs) return 'At least one language body is required for email campaigns.';
  } else {
    if (!input.body || input.body.trim() === '') return 'Message body is required.';
  }
  if (!input.segment || (!isValidSegment(input.segment) && !isCustomSegmentId(input.segment))) return 'Please select a valid audience segment.';
  if (input.type === 'push' && (!input.subject || input.subject.trim() === '')) {
    return 'Push notification subject is required.';
  }
  if (input.type === 'email' && (!input.subject || input.subject.trim() === '')) {
    return 'Email subject is required.';
  }
  return null;
}

// ─── CREATE CAMPAIGN ─────────────────────────────────────────────────────────

export async function createCampaign(formData: FormData) {
  const tenant = await resolveAuthedTenant();
  if (!tenant) return { error: 'Not authenticated.' };

  const type = formData.get('type') as string;
  const input = {
    name: formData.get('name') as string,
    type,
    subject: formData.get('subject') as string | null,
    subject_es: formData.get('subject_es') as string | null,
    body: formData.get('body') as string,
    body_en: formData.get('body_en') as string | null,
    body_es: formData.get('body_es') as string | null,
    image_url: formData.get('image_url') as string | null,
    cta_text: formData.get('cta_text') as string | null,
    cta_url: formData.get('cta_url') as string | null,
    segment: formData.get('segment') as string,
    bonus_points: parseInt(formData.get('bonus_points') as string) || 0,
    bonus_multiplier: parseFloat(formData.get('bonus_multiplier') as string) || 1.0,
  };

  const validationError = validateCampaignInput(input);
  if (validationError) return { error: validationError };

  try {
    await requireCampaignSlot(tenant.tenantId);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const buildDescription = (i: typeof input) => {
    if (i.type === 'email') return JSON.stringify({ body_en: i.body_en, body_es: i.body_es });
    if (i.type === 'push' && (i.subject_es || i.body_es)) {
      return JSON.stringify({ subject_es: i.subject_es || '', body_es: i.body_es || '' });
    }
    return null;
  };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      tenant_id: tenant.tenantId,
      created_by: tenant.userId,
      name: input.name.trim(),
      type: input.type,
      subject: input.subject || null,
      body: input.body ? input.body.trim() : (input.body_en || input.body_es || ''),
      description: buildDescription(input),
      image_url: input.image_url || null,
      cta_text: input.cta_text || null,
      cta_url: input.cta_url || null,
      segment: input.segment,
      bonus_points: input.bonus_points,
      bonus_multiplier: input.bonus_multiplier,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/campaigns');
  return { data: { id: data.id } };
}

// ─── UPDATE CAMPAIGN ─────────────────────────────────────────────────────────

export async function updateCampaign(campaignId: string, formData: FormData) {
  const tenant = await resolveAuthedTenant();
  if (!tenant) return { error: 'Not authenticated.' };

  const supabase = await createServerSupabaseClient();

  // Only allow updates on draft campaigns
  const { data: existing } = await supabase
    .from('campaigns')
    .select('status')
    .eq('id', campaignId)
    .eq('tenant_id', tenant.tenantId)
    .single();

  if (!existing) return { error: 'Campaign not found.' };
  if (existing.status !== 'draft') return { error: 'Only draft campaigns can be edited.' };

  const updateType = formData.get('type') as string;
  const input = {
    name: formData.get('name') as string,
    type: updateType,
    subject: formData.get('subject') as string | null,
    subject_es: formData.get('subject_es') as string | null,
    body: formData.get('body') as string,
    body_en: formData.get('body_en') as string | null,
    body_es: formData.get('body_es') as string | null,
    image_url: formData.get('image_url') as string | null,
    cta_text: formData.get('cta_text') as string | null,
    cta_url: formData.get('cta_url') as string | null,
    segment: formData.get('segment') as string,
    bonus_points: parseInt(formData.get('bonus_points') as string) || 0,
    bonus_multiplier: parseFloat(formData.get('bonus_multiplier') as string) || 1.0,
  };

  const validationError = validateCampaignInput(input);
  if (validationError) return { error: validationError };

  const buildDescription = (i: typeof input) => {
    if (i.type === 'email') return JSON.stringify({ body_en: i.body_en, body_es: i.body_es });
    if (i.type === 'push' && (i.subject_es || i.body_es)) {
      return JSON.stringify({ subject_es: i.subject_es || '', body_es: i.body_es || '' });
    }
    return null;
  };

  const { error } = await supabase
    .from('campaigns')
    .update({
      name: input.name.trim(),
      type: input.type,
      subject: input.subject || null,
      body: input.body ? input.body.trim() : (input.body_en || input.body_es || ''),
      description: buildDescription(input),
      image_url: input.image_url || null,
      cta_text: input.cta_text || null,
      cta_url: input.cta_url || null,
      segment: input.segment,
      bonus_points: input.bonus_points,
      bonus_multiplier: input.bonus_multiplier,
    })
    .eq('id', campaignId)
    .eq('tenant_id', tenant.tenantId);

  if (error) return { error: error.message };

  revalidatePath('/campaigns');
  return { success: true };
}

// ─── SCHEDULE CAMPAIGN ────────────────────────────────────────────────────────

export async function scheduleCampaign(campaignId: string, scheduledAt: string) {
  const tenant = await resolveAuthedTenant();
  if (!tenant) return { error: 'Not authenticated.' };

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) {
    return { error: 'Scheduled time must be in the future.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'scheduled', scheduled_at: scheduledAt })
    .eq('id', campaignId)
    .eq('tenant_id', tenant.tenantId)
    .eq('status', 'draft');

  if (error) return { error: error.message };

  revalidatePath('/campaigns');
  return { success: true };
}

// ─── SEND CAMPAIGN NOW ────────────────────────────────────────────────────────

export async function sendCampaignNow(campaignId: string) {
  const tenant = await resolveAuthedTenant();
  if (!tenant) return { error: 'Not authenticated.' };

  const supabase = await createServerSupabaseClient();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('tenant_id', tenant.tenantId)
    .single();

  if (!campaign) return { error: 'Campaign not found.' };
  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    return { error: 'Campaign cannot be sent in its current state.' };
  }
  if (!campaign.segment || (!isValidSegment(campaign.segment as string) && !isCustomSegmentId(campaign.segment as string))) {
    return { error: 'Invalid segment.' };
  }

  // Mark as sending
  await supabase
    .from('campaigns')
    .update({ status: 'sending' })
    .eq('id', campaignId);

  let memberIds: string[] = [];
  try {
    memberIds = await getMemberIdsForSegment(tenant.tenantId, campaign.segment as string);
  } catch {
    await supabase
      .from('campaigns')
      .update({ status: 'error', description: 'Failed to resolve audience segment.' })
      .eq('id', campaignId);
    return { error: 'Failed to resolve audience segment.' };
  }

  if (memberIds.length === 0) {
    await supabase
      .from('campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString(), recipients_count: 0 })
      .eq('id', campaignId);
    revalidatePath('/campaigns');
    return { success: true, sent: 0 };
  }

  // Get member emails for email campaigns
  const { data: members } = await supabase
    .from('members')
    .select('id, email, name')
    .in('id', memberIds);

  type MemberRow = { id: string; email: string; name: string };
  const memberMap = new Map<string, MemberRow>(
    (members ?? []).map((m: MemberRow) => [m.id, m])
  );

  let sentCount = 0;
  const notificationRows: object[] = [];
  let sendError: string | null = null;

  if (campaign.type === 'push') {
    // ─── ONESIGNAL PUSH ───────────────────────────────────────────────────────
    // ONESIGNAL_APP_ID — found in OneSignal dashboard under Settings > Keys & IDs
    // ONESIGNAL_API_KEY — REST API key from the same location
    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_API_KEY;

    if (!appId || !apiKey) {
      sendError = 'OneSignal credentials are not configured.';
    } else {
      try {
        // Parse bilingual push content stored in description
        let pushSubjectEs: string | null = null;
        let pushBodyEs: string | null = null;
        if (campaign.description) {
          try {
            const pushDesc = JSON.parse(campaign.description) as { subject_es?: string; body_es?: string };
            pushSubjectEs = pushDesc.subject_es || null;
            pushBodyEs = pushDesc.body_es || null;
          } catch { /* not bilingual JSON — use EN only */ }
        }

        const res = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${apiKey}`,
          },
          body: JSON.stringify({
            app_id: appId,
            include_external_user_ids: memberIds,
            headings: {
              en: campaign.subject ?? campaign.name,
              ...(pushSubjectEs ? { es: pushSubjectEs } : {}),
            },
            contents: {
              en: campaign.body,
              ...(pushBodyEs ? { es: pushBodyEs } : {}),
            },
            data: {
              campaignId,
              bonusPoints: campaign.bonus_points,
              ctaUrl: campaign.cta_url,
            },
            ...(campaign.image_url ? { big_picture: campaign.image_url } : {}),
          }),
        });

        const json = (await res.json()) as { id?: string; errors?: string[] };

        if (json.id) {
          sentCount = memberIds.length;
          for (const memberId of memberIds) {
            notificationRows.push({
              tenant_id: tenant.tenantId,
              member_id: memberId,
              campaign_id: campaignId,
              channel: 'push',
              type: 'campaign',
              title: campaign.subject ?? campaign.name,
              subject: campaign.subject,
              content: campaign.body,
              image_url: campaign.image_url,
              status: 'sent',
              sent_at: new Date().toISOString(),
              onesignal_id: json.id,
              data: { bonusPoints: campaign.bonus_points },
            });
          }
        } else {
          sendError = `OneSignal error: ${JSON.stringify(json.errors)}`;
        }
      } catch (e) {
        sendError = `OneSignal request failed: ${(e as Error).message}`;
      }
    }
  } else if (campaign.type === 'email') {
    // ─── RESEND EMAIL ─────────────────────────────────────────────────────────
    // RESEND_API_KEY — found in Resend dashboard under API Keys
    // From address should match tenant custom domain when available for better deliverability.
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      sendError = 'Resend API key is not configured.';
    } else {
      // Parse bilingual body stored in description field
      let body_en: string | null = null;
      let body_es: string | null = null;
      if (campaign.description) {
        try {
          const parsed = JSON.parse(campaign.description) as { body_en?: string; body_es?: string };
          body_en = parsed.body_en || null;
          body_es = parsed.body_es || null;
        } catch {
          // description is not bilingual JSON — use body as fallback for both
          body_en = campaign.body;
          body_es = campaign.body;
        }
      } else {
        body_en = campaign.body;
        body_es = campaign.body;
      }

      const { enSubject, esSubject, enHtmlContent, esHtmlContent } = buildCampaignEmail({
        campaignName: campaign.name ?? '',
        subject: campaign.subject ?? '',
        enBody: body_en ?? '',
        esBody: body_es ?? '',
        ctaText: campaign.cta_text ?? '',
        ctaUrl: campaign.cta_url ?? '',
        businessName: campaign.name ?? '',
      });

      const { subject: emailSubject, html: emailHtml } = buildBilingualEmail({
        enSubject,
        esSubject,
        enHtmlContent,
        esHtmlContent,
      });

      for (const memberId of memberIds) {
        const member = memberMap.get(memberId);
        if (!member?.email) continue;

        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: 'LoyaltyOS <campaigns@loyalbase.dev>',
              to: [member.email],
              subject: emailSubject,
              html: emailHtml,
            }),
          });

          const json = (await res.json()) as { id?: string; message?: string };

          notificationRows.push({
            tenant_id: tenant.tenantId,
            member_id: memberId,
            campaign_id: campaignId,
            channel: 'email',
            type: 'campaign',
            title: campaign.subject ?? campaign.name,
            subject: campaign.subject,
            content: campaign.body,
            status: json.id ? 'sent' : 'failed',
            sent_at: json.id ? new Date().toISOString() : null,
            data: { resendId: json.id, error: json.message },
          });

          if (json.id) sentCount++;
        } catch (e) {
          notificationRows.push({
            tenant_id: tenant.tenantId,
            member_id: memberId,
            campaign_id: campaignId,
            channel: 'email',
            type: 'campaign',
            title: campaign.subject ?? campaign.name,
            subject: campaign.subject,
            content: campaign.body,
            status: 'failed',
            error_message: (e as Error).message,
          });
        }
      }
    }
  } else if (campaign.type === 'inapp') {
    // In-app notifications — stored in DB only, no external API
    for (const memberId of memberIds) {
      notificationRows.push({
        tenant_id: tenant.tenantId,
        member_id: memberId,
        campaign_id: campaignId,
        channel: 'inapp',
        type: 'campaign',
        title: campaign.subject ?? campaign.name,
        content: campaign.body,
        image_url: campaign.image_url,
        status: 'sent',
        sent_at: new Date().toISOString(),
        data: { bonusPoints: campaign.bonus_points },
      });
      sentCount++;
    }
  }

  // Persist notification rows in batches
  if (notificationRows.length > 0) {
    const BATCH = 50;
    for (let i = 0; i < notificationRows.length; i += BATCH) {
      await supabase.from('notifications').insert(notificationRows.slice(i, i + BATCH));
    }
  }

  // Update campaign status
  if (sendError && sentCount === 0) {
    await supabase
      .from('campaigns')
      .update({ status: 'error', description: sendError })
      .eq('id', campaignId);
    return { error: sendError };
  }

  await supabase
    .from('campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipients_count: memberIds.length,
      delivered_count: sentCount,
    })
    .eq('id', campaignId);

  revalidatePath('/campaigns');
  return { success: true, sent: sentCount };
}

// ─── DUPLICATE CAMPAIGN ───────────────────────────────────────────────────────

export async function duplicateCampaign(campaignId: string) {
  const tenant = await resolveAuthedTenant();
  if (!tenant) return { error: 'Not authenticated.' };

  const supabase = await createServerSupabaseClient();
  const { data: original } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('tenant_id', tenant.tenantId)
    .single();

  if (!original) return { error: 'Campaign not found.' };

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      tenant_id: tenant.tenantId,
      created_by: tenant.userId,
      name: `Copy of ${original.name}`,
      type: original.type,
      subject: original.subject,
      body: original.body,
      image_url: original.image_url,
      cta_text: original.cta_text,
      cta_url: original.cta_url,
      segment: original.segment,
      bonus_points: original.bonus_points,
      bonus_multiplier: original.bonus_multiplier,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/campaigns');
  return { data: { id: data.id } };
}

// ─── DELETE CAMPAIGN ─────────────────────────────────────────────────────────

export async function deleteCampaign(campaignId: string) {
  const tenant = await resolveAuthedTenant();
  if (!tenant) return { error: 'Not authenticated.' };

  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from('campaigns')
    .select('status')
    .eq('id', campaignId)
    .eq('tenant_id', tenant.tenantId)
    .single();

  if (!existing) return { error: 'Campaign not found.' };
  if (existing.status !== 'draft') return { error: 'Only draft campaigns can be deleted.' };

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('tenant_id', tenant.tenantId);

  if (error) return { error: error.message };

  revalidatePath('/campaigns');
  return { success: true };
}

// ─── CANCEL CAMPAIGN ─────────────────────────────────────────────────────────

export async function cancelCampaign(campaignId: string) {
  const tenant = await resolveAuthedTenant();
  if (!tenant) return { error: 'Not authenticated.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'draft', scheduled_at: null })
    .eq('id', campaignId)
    .eq('tenant_id', tenant.tenantId)
    .eq('status', 'scheduled');

  if (error) return { error: error.message };

  revalidatePath('/campaigns');
  return { success: true };
}
