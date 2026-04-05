'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { getMemberRedemptionCount } from './queries';
import type { RedemptionResult } from './types';

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
    return { success: false, error: 'Miembro no encontrado.' };
  }
  if (rewardRes.error || !rewardRes.data) {
    return { success: false, error: 'Recompensa no encontrada.' };
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
    return { success: false, error: 'Esta recompensa ya no está disponible.' };
  }

  // 3. Validate tenant match
  if (member.tenant_id !== reward.tenant_id) {
    return { success: false, error: 'Recompensa no disponible para este negocio.' };
  }

  // 4. Check sufficient points
  if (member.points_balance < reward.points_cost) {
    return { success: false, error: 'No tenés suficientes puntos para canjear esta recompensa.' };
  }

  // 5. Check max_per_member
  const redemptionCount = await getMemberRedemptionCount(memberId, rewardId);
  if (redemptionCount >= reward.max_per_member) {
    return { success: false, error: 'Ya alcanzaste el límite de canjes para esta recompensa.' };
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
      code,
      qr_data: qrData,
      points_spent: reward.points_cost,
      monetary_value: reward.monetary_value,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (redemptionError || !redemption) {
    console.error('Redemption insert error:', redemptionError);
    return { success: false, error: 'Error al procesar el canje. Intentá de nuevo.' };
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
    description: `Canje — ${reward.name}`,
  });

  if (transactionError) {
    // Non-fatal: redemption was created, log the error
    console.error('Transaction insert error:', transactionError);
  }

  // 9. Update member points balance
  const { error: updateError } = await serviceClient
    .from('members')
    .update({ points_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', memberId);

  if (updateError) {
    console.error('Member points update error:', updateError);
  }

  return {
    success: true,
    data: {
      id: redemption.id,
      code,
      qr_data: qrData,
      points_spent: reward.points_cost,
      expires_at: expiresAt.toISOString(),
      reward_name: reward.name,
    },
  };
}
