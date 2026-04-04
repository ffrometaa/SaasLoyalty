import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export interface Campaign {
  id: string;
  tenant_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  type: 'push' | 'email' | 'sms' | 'inapp';
  subject: string | null;
  body: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  bonus_points: number;
  bonus_multiplier: number;
  segment: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'error';
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  redeemed_count: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignNotification {
  id: string;
  member_id: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  onesignal_id: string | null;
  members: { name: string; email: string } | null;
}

export interface CampaignMetrics {
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  redeemed: number;
  openRate: number;
  redemptionRate: number;
}

// ─── LIST ─────────────────────────────────────────────────────────────────────

export async function getCampaigns(
  tenantId: string,
  options: { page?: number; limit?: number; status?: string } = {}
): Promise<{ campaigns: Campaign[]; total: number }> {
  const supabase = await createServerSupabaseClient();
  const page = options.page ?? 1;
  const limit = options.limit ?? 100;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('campaigns')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) {
    query = query.eq('status', options.status);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { campaigns: (data as Campaign[]) ?? [], total: count ?? 0 };
}

// ─── SINGLE ───────────────────────────────────────────────────────────────────

export async function getCampaignById(
  tenantId: string,
  campaignId: string
): Promise<Campaign | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', campaignId)
    .single();

  if (error) return null;
  return data as Campaign;
}

// ─── METRICS ──────────────────────────────────────────────────────────────────

export async function getCampaignMetrics(
  tenantId: string,
  campaignId: string
): Promise<CampaignMetrics | null> {
  const campaign = await getCampaignById(tenantId, campaignId);
  if (!campaign) return null;

  const recipients = campaign.recipients_count ?? 0;
  const delivered = campaign.delivered_count ?? 0;
  const opened = campaign.opened_count ?? 0;
  const clicked = campaign.clicked_count ?? 0;
  const redeemed = campaign.redeemed_count ?? 0;

  return {
    recipients,
    delivered,
    opened,
    clicked,
    redeemed,
    openRate: recipients > 0 ? Math.round((opened / recipients) * 1000) / 10 : 0,
    redemptionRate: recipients > 0 ? Math.round((redeemed / recipients) * 1000) / 10 : 0,
  };
}

// ─── MONTHLY COUNT ────────────────────────────────────────────────────────────

export async function getCampaignsThisMonth(tenantId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfMonth.toISOString());

  return count ?? 0;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function getCampaignNotifications(
  tenantId: string,
  campaignId: string
): Promise<CampaignNotification[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, member_id, status, sent_at, opened_at, clicked_at, onesignal_id, members(name, email)')
    .eq('tenant_id', tenantId)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CampaignNotification[];
}

// ─── STATUS COUNTS ────────────────────────────────────────────────────────────

export async function getCampaignStatusCounts(
  tenantId: string
): Promise<Record<string, number>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('status')
    .eq('tenant_id', tenantId);

  if (error) throw error;

  const counts: Record<string, number> = {
    all: 0,
    draft: 0,
    scheduled: 0,
    sending: 0,
    sent: 0,
    error: 0,
  };

  for (const row of data ?? []) {
    counts.all++;
    if (row.status in counts) counts[row.status]++;
  }

  return counts;
}
