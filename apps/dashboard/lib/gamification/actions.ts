'use server';

import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';
import { revalidatePath } from 'next/cache';
import type { ChallengeType, ChallengeStatus } from './queries';

// ─── HELPERS ───────────────────────────────────────────────

async function resolveAuthedTenantId(): Promise<string | null> {
  const user = await getAuthedUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { data: ownerTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (ownerTenant?.id) return ownerTenant.id;

  const { data: staffRecord } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single();

  return staffRecord?.tenant_id ?? null;
}

// ─── CHALLENGES ────────────────────────────────────────────

export interface CreateChallengeInput {
  name: string;
  description?: string;
  type: ChallengeType;
  goal_value: number;
  bonus_points?: number;
  badge_id?: string;
  starts_at?: string;
  ends_at?: string;
  status?: ChallengeStatus;
}

export async function createChallenge(input: CreateChallengeInput) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Unauthorized' };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      goal_value: input.goal_value,
      bonus_points: input.bonus_points ?? 0,
      badge_id: input.badge_id ?? null,
      starts_at: input.starts_at ?? null,
      ends_at: input.ends_at ?? null,
      status: input.status ?? 'draft',
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/gamification');
  return { data };
}

export async function updateChallengeStatus(challengeId: string, status: ChallengeStatus) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Unauthorized' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('challenges')
    .update({ status })
    .eq('id', challengeId)
    .eq('tenant_id', tenantId);

  if (error) return { error: error.message };
  revalidatePath('/gamification');
  return { success: true };
}

export async function deleteChallenge(challengeId: string) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Unauthorized' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('challenges')
    .delete()
    .eq('id', challengeId)
    .eq('tenant_id', tenantId)
    .eq('status', 'draft'); // only draft challenges can be deleted

  if (error) return { error: error.message };
  revalidatePath('/gamification');
  return { success: true };
}

// ─── BADGES ────────────────────────────────────────────────

export interface CreateBadgeInput {
  name: string;
  description?: string;
  icon_url?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export async function createBadge(input: CreateBadgeInput) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Unauthorized' };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('badges')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description ?? null,
      icon_url: input.icon_url ?? null,
      rarity: input.rarity ?? 'common',
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/gamification');
  return { data };
}

// ─── MEMBER PROGRESS ───────────────────────────────────────

export async function awardBadgeToMember(memberId: string, badgeId: string) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Unauthorized' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('member_badges')
    .insert({ tenant_id: tenantId, member_id: memberId, badge_id: badgeId });

  if (error) return { error: error.message };
  return { success: true };
}
