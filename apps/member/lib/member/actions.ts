'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { getMemberRedemptionCount } from './queries';
import type { RedemptionResult } from './types';
import { getTranslations } from 'next-intl/server';

function generateCode(tenantSlug: string): string {
  const prefix = tenantSlug.slice(0, 2).toUpperCase();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${suffix}`;
}

export async function createRedemption(
  rewardId: string,
  memberId: string
): Promise<{ success: true; data: RedemptionResult } | { success: false; error: string }> {
  const t = await getTranslations('actions');
  const supabase = await createServerSupabaseClient();
  const serviceClient = createServiceRoleClient();

  // 1. Fetch member + reward + tenant in parallel
  const [memberRes, rewardRes] = await Promise.all([
    supabase
      .from('members')
      .select('id, tenant_id, points_balance, tenants!inner(slug)')
      .eq('id', memberId)
      .single(),
    supabase
      .from('rewards')
      .select('id, tenant_id, name, points_cost, monetary_value, valid_days, is_active, max_per_member, deleted_at')
      .eq('id', rewardId)
      .single(),
  ]);

  if (memberRes.error || !memberRes.data) {
    return { success: false, error: t('errors.memberNotFound') };
  }
  if (rewardRes.error || !rewardRes.data) {
    return { success: false, error: t('errors.rewardNotFound') };
  }

  const member = memberRes.data as {
    id: string;
    tenant_id: string;
    points_balance: number;
    tenants: { slug: string };
  };
  const reward = rewardRes.data as {
    id: string;
    tenant_id: string;
    name: string;
    points_cost: number;
    monetary_value: number | null;
    valid_days: number;
    is_active: boolean;
    max_per_member: number;
    deleted_at: string | null;
  };

  // 2. Validate reward is active
  if (!reward.is_active || reward.deleted_at) {
    return { success: false, error: t('errors.rewardUnavailable') };
  }

  // 3. Validate tenant match
  if (member.tenant_id !== reward.tenant_id) {
    return { success: false, error: t('errors.rewardTenantMismatch') };
  }

  // 4. Check sufficient points
  if (member.points_balance < reward.points_cost) {
    return { success: false, error: t('errors.insufficientPoints') };
  }

  // 5. Check max_per_member
  const redemptionCount = await getMemberRedemptionCount(memberId, rewardId);
  if (redemptionCount >= reward.max_per_member) {
    return { success: false, error: t('errors.maxPerMemberReached') };
  }

  // 6. Generate code and QR data
  const tenantSlug = (member.tenants as unknown as { slug: string }).slug;
  const code = generateCode(tenantSlug);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (reward.valid_days ?? 30));
  const qrData = JSON.stringify({
    type: 'redemption',
    code,
    reward_id: rewardId,
    member_id: memberId,
    expires_at: expiresAt.toISOString(),
  });

  // 7. Insert redemption
  const { data: redemption, error: redemptionError } = await serviceClient
    .from('redemptions')
    .insert({
      tenant_id: member.tenant_id,
      member_id: memberId,
      reward_id: rewardId,
      alphanumeric_code: code,
      qr_code: qrData,
      points_spent: reward.points_cost,
      monetary_value: reward.monetary_value,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (redemptionError || !redemption) {
    console.error('Redemption insert error:', redemptionError);
    return { success: false, error: t('errors.redemptionFailed') };
  }

  // 8. Insert transaction
  const newBalance = member.points_balance - reward.points_cost;
  const { error: transactionError } = await serviceClient.from('transactions').insert({
    tenant_id: member.tenant_id,
    member_id: memberId,
    reward_id: rewardId,
    redemption_id: redemption.id,
    type: 'redeem',
    points: -reward.points_cost,
    points_balance: newBalance,
    description: t('transactionDescription', { name: reward.name }),
  });

  if (transactionError) {
    // Non-fatal: redemption was created, log the error
    console.error('Transaction insert error:', transactionError);
  }

  // 9. Update member points balance — atomic conditional UPDATE guards against race conditions.
  // If another concurrent request already decremented the balance, the .gte() guard fails → count=0.
  // TODO: replace with atomic Postgres RPC function for true single-round-trip safety
  const { count: updatedCount, error: updateError } = await serviceClient
    .from('members')
    .update({
      points_balance: member.points_balance - reward.points_cost,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .gte('points_balance', reward.points_cost)
    .select('id', { count: 'exact', head: true });

  if (updateError || !updatedCount || updatedCount === 0) {
    // Compensating delete — redemption row was already inserted; clean it up
    await serviceClient.from('redemptions').delete().eq('id', redemption.id);
    return { success: false, error: t('errors.insufficientPoints') };
  }

  return {
    success: true,
    data: {
      id: redemption.id,
      alphanumeric_code: code,
      qr_code: qrData,
      points_spent: reward.points_cost,
      expires_at: expiresAt.toISOString(),
      reward_name: reward.name,
    },
  };
}
