import { createServerSupabaseClient } from '@loyalty-os/lib/server';

type MultiplierCondition =
  | 'always'
  | 'tier_bronze'
  | 'tier_silver'
  | 'tier_gold'
  | 'tier_platinum'
  | 'new_member'
  | 'at_risk';

interface MultiplierRow {
  id: string;
  tenant_id: string;
  name: string;
  multiplier: number;
  condition: MultiplierCondition;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface MemberContext {
  tier: string;
  daysSinceJoin: number;  // used to classify 'new_member'
  churnScore: number;      // used to classify 'at_risk'
}

function conditionMatches(condition: MultiplierCondition, member: MemberContext): boolean {
  switch (condition) {
    case 'always':
      return true;
    case 'tier_bronze':
      return member.tier === 'bronze';
    case 'tier_silver':
      return member.tier === 'silver';
    case 'tier_gold':
      return member.tier === 'gold';
    case 'tier_platinum':
      return member.tier === 'platinum';
    case 'new_member':
      return member.daysSinceJoin <= 30;
    case 'at_risk':
      return member.churnScore >= 0.6;
    default:
      return false;
  }
}

/**
 * Returns the highest active multiplier value that applies to this member.
 * Returns 1 (no multiplier) if none match.
 */
export async function getApplicableMultiplier(
  tenantId = '',
  member: MemberContext
): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('point_multipliers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now);

  if (!data || data.length === 0) return 1;

  const active = (data as MultiplierRow[]).filter(m => conditionMatches(m.condition, member));
  if (active.length === 0) return 1;

  return Math.max(...active.map(m => m.multiplier));
}

/**
 * Apply the matching multiplier to a raw point amount.
 */
export async function applyMultiplier(
  tenantId = '',
  member: MemberContext,
  basePoints = 0
): Promise<{ finalPoints: number; multiplier: number }> {
  const multiplier = await getApplicableMultiplier(tenantId, member);
  return { finalPoints: Math.round(basePoints * multiplier), multiplier };
}

/**
 * Fetch all multipliers for a tenant (for dashboard display).
 */
export async function getTenantMultipliers(tenantId = '') {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('point_multipliers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('starts_at', { ascending: false });
  return data ?? [];
}

/**
 * Create a new multiplier event.
 */
export async function createMultiplier(params: {
  tenantId: string;
  name: string;
  multiplier: number;
  condition: MultiplierCondition;
  startsAt: string;
  endsAt: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('point_multipliers')
    .insert({
      tenant_id: params.tenantId,
      name: params.name,
      multiplier: params.multiplier,
      condition: params.condition,
      starts_at: params.startsAt,
      ends_at: params.endsAt,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Deactivate a multiplier.
 */
export async function deactivateMultiplier(multiplierId = '') {
  const supabase = await createServerSupabaseClient();
  await supabase
    .from('point_multipliers')
    .update({ is_active: false })
    .eq('id', multiplierId);
}

/**
 * Fetch the currently active multipliers for a tenant (for member PWA display).
 */
export async function getActiveMultipliersForTenant(tenantId = '') {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('point_multipliers')
    .select('id, name, multiplier, condition, starts_at, ends_at')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('multiplier', { ascending: false });
  return data ?? [];
}
