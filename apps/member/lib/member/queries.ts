import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import type { MemberProfile, RewardItem, TransactionItem } from './types';

export async function getMemberWithTenant(userId: string): Promise<MemberProfile | null> {
  // Use service role to bypass RLS on tenants — the join fails silently when
  // the member session has no SELECT policy on tenants. Auth is verified upstream.
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('members')
    .select(`
      id,
      tenant_id,
      name,
      email,
      tier,
      points_balance,
      points_lifetime,
      member_code,
      avatar_url,
      tenant:tenants!inner (
        id,
        business_name,
        brand_app_name,
        brand_logo_url,
        brand_color_primary,
        brand_color_secondary,
        slug,
        points_expiry_days
      )
    `)
    .eq('auth_user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !data) return null;

  return data as unknown as MemberProfile;
}

export async function getRewardsForTenant(
  tenantId: string,
  memberPoints: number,
  limit?: number
): Promise<{ available: RewardItem[]; locked: RewardItem[] }> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('rewards')
    .select(
      'id, tenant_id, name, description, image_url, category, points_cost, monetary_value, is_active, valid_days, min_tier, max_per_member, sort_order'
    )
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('points_cost', { ascending: true });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error || !data) return { available: [], locked: [] };

  const rewards = data as RewardItem[];
  const available = rewards.filter((r) => r.points_cost <= memberPoints);
  const locked = rewards.filter((r) => r.points_cost > memberPoints);

  return { available, locked };
}

export async function getMemberTransactions(
  memberId: string,
  limit = 20
): Promise<TransactionItem[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, points, points_balance, description, created_at')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as TransactionItem[];
}

export async function getRewardById(rewardId: string): Promise<RewardItem | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('rewards')
    .select(
      'id, tenant_id, name, description, image_url, category, points_cost, monetary_value, is_active, valid_days, min_tier, max_per_member, sort_order'
    )
    .eq('id', rewardId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;
  return data as RewardItem;
}

export async function getMemberRedemptionCount(
  memberId: string,
  rewardId: string
): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('reward_id', rewardId)
    .neq('status', 'canceled');

  if (error) return 0;
  return count ?? 0;
}
