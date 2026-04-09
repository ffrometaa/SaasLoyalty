'use server';

import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { revalidatePath } from 'next/cache';
import type { SegmentCondition } from './custom-segment-types';

// ─── AUTH HELPER ─────────────────────────────────────────────────────────────

async function resolveAuthedTenantId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await (supabase.auth as { getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }> }).getSession();
  if (!session?.user) return null;

  const { data: ownerTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('auth_user_id', session.user.id)
    .is('deleted_at', null)
    .single();

  if (ownerTenant?.id) return ownerTenant.id;

  const { data: staffRecord } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('auth_user_id', session.user.id)
    .single();

  return staffRecord?.tenant_id ?? null;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createCustomSegment(params: {
  name: string;
  description: string;
  conditions: SegmentCondition[];
}) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Not authenticated.' };

  if (!params.name.trim()) return { error: 'Name is required.' };
  if (params.conditions.length === 0) return { error: 'At least one condition is required.' };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tenant_custom_segments')
    .insert({
      tenant_id: tenantId,
      name: params.name.trim(),
      description: params.description.trim() || null,
      conditions: params.conditions,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/campaigns/segments');
  return { data: { id: data.id } };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateCustomSegment(
  segmentId: string,
  params: { name: string; description: string; conditions: SegmentCondition[] }
) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Not authenticated.' };

  if (!params.name.trim()) return { error: 'Name is required.' };
  if (params.conditions.length === 0) return { error: 'At least one condition is required.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('tenant_custom_segments')
    .update({
      name: params.name.trim(),
      description: params.description.trim() || null,
      conditions: params.conditions,
    })
    .eq('id', segmentId)
    .eq('tenant_id', tenantId);

  if (error) return { error: error.message };

  revalidatePath('/campaigns/segments');
  return { success: true };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteCustomSegment(segmentId: string) {
  const tenantId = await resolveAuthedTenantId();
  if (!tenantId) return { error: 'Not authenticated.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('tenant_custom_segments')
    .delete()
    .eq('id', segmentId)
    .eq('tenant_id', tenantId);

  if (error) return { error: error.message };

  revalidatePath('/campaigns/segments');
  return { success: true };
}
