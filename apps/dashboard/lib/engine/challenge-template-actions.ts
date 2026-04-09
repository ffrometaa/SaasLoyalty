'use server';

import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { revalidatePath } from 'next/cache';
import type { MotivationType } from './behaviorScoring';
import type { ChallengeType } from './challenge-template-queries';

async function resolveAuthedTenantId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await (supabase.auth as { getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }> }).getSession();
  if (!session?.user) return null;

  const { data: ownerTenant } = await supabase
    .from('tenants').select('id')
    .eq('auth_user_id', session.user.id).is('deleted_at', null).single();
  if (ownerTenant?.id) return ownerTenant.id;

  const { data: staffRecord } = await supabase
    .from('tenant_users').select('tenant_id')
    .eq('auth_user_id', session.user.id).single();
  return staffRecord?.tenant_id ?? null;
}

export async function upsertChallengeTemplate(params: {
  motivationType: MotivationType;
  challengeType: ChallengeType;
  name: string;
  description: string;
  bonusPoints: number;
  ttlDays: number;
  goalMultiplier: number;
}) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Not authenticated.' };

  if (!params.name.trim()) return { error: 'Name is required.' };
  if (!params.description.trim()) return { error: 'Description is required.' };
  if (params.bonusPoints < 10 || params.bonusPoints > 5000) return { error: 'Bonus points must be between 10 and 5000.' };
  if (params.ttlDays < 1 || params.ttlDays > 90) return { error: 'Duration must be between 1 and 90 days.' };
  if (params.goalMultiplier < 0.5 || params.goalMultiplier > 5) return { error: 'Goal multiplier must be between 0.5 and 5.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('tenant_challenge_templates')
    .upsert(
      {
        tenant_id: tenantId,
        motivation_type: params.motivationType,
        challenge_type: params.challengeType,
        name: params.name.trim(),
        description: params.description.trim(),
        bonus_points: params.bonusPoints,
        ttl_days: params.ttlDays,
        goal_multiplier: params.goalMultiplier,
        is_active: true,
      },
      { onConflict: 'tenant_id,motivation_type,challenge_type' }
    );

  if (error) return { error: error.message };

  revalidatePath('/gamification/challenge-templates');
  return { success: true };
}

export async function deleteChallengeTemplate(templateId: string) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Not authenticated.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('tenant_challenge_templates')
    .delete()
    .eq('id', templateId)
    .eq('tenant_id', tenantId);

  if (error) return { error: error.message };

  revalidatePath('/gamification/challenge-templates');
  return { success: true };
}
