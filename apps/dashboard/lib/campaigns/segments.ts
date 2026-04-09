import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import type { SegmentId } from './segment-constants';
import type { SegmentCondition } from './custom-segment-types';

// Re-export constants so existing imports still work
export { SEGMENTS, type SegmentId, isValidSegment } from './segment-constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

const TIER_BY_SEGMENT: Partial<Record<SegmentId, string>> = {
  tier_bronze:   'bronze',
  tier_silver:   'silver',
  tier_gold:     'gold',
  tier_platinum: 'platinum',
};

// UUID v4 pattern — used to detect custom segment IDs vs built-in string IDs
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCustomSegmentId(id: string): boolean {
  return UUID_RE.test(id);
}

// ─── Built-in segment resolver ────────────────────────────────────────────────

async function resolveBuiltInSegment(tenantId: string, segmentId: SegmentId): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const now = new Date();

  if (segmentId === 'birthday_month') {
    const month = now.getMonth() + 1;
    const { data } = await supabase
      .from('members')
      .select('id, birthday')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .not('birthday', 'is', null);

    return (data ?? [])
      .filter((m: { id: string; birthday: string | null }) =>
        m.birthday && new Date(m.birthday).getMonth() + 1 === month
      )
      .map((m: { id: string }) => m.id);
  }

  let query = supabase
    .from('members')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  const tier = TIER_BY_SEGMENT[segmentId];
  if (tier) {
    query = query.eq('tier', tier);
  } else if (segmentId === 'active') {
    query = query.gte('last_visit_at', daysAgo(now, 30));
  } else if (segmentId === 'at_risk') {
    query = query.lt('last_visit_at', daysAgo(now, 30)).gte('last_visit_at', daysAgo(now, 60));
  } else if (segmentId === 'inactive') {
    query = query.lt('last_visit_at', daysAgo(now, 60));
  }
  // 'all' — no additional filter beyond tenant + active

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((m: { id: string }) => m.id);
}

// ─── Custom segment evaluator ─────────────────────────────────────────────────

export async function evaluateCustomSegment(tenantId: string, segmentId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  const { data: segment, error: segErr } = await supabase
    .from('tenant_custom_segments')
    .select('conditions')
    .eq('id', segmentId)
    .eq('tenant_id', tenantId)
    .single();

  if (segErr || !segment) return [];

  const conditions = (segment.conditions ?? []) as SegmentCondition[];
  const now = new Date();

  let query = supabase
    .from('members')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  for (const cond of conditions) {
    if (cond.field === 'tier') {
      query = query.eq('tier', cond.value);
    } else if (cond.field === 'days_since_visit') {
      // "days_since_visit >= N" → last_visit_at <= N days ago
      // "days_since_visit <= N" → last_visit_at >= N days ago
      const cutoff = daysAgo(now, cond.value);
      query = cond.operator === 'gte'
        ? query.lte('last_visit_at', cutoff)
        : query.gte('last_visit_at', cutoff);
    } else {
      // points_balance, points_lifetime, visits_total
      query = cond.operator === 'gte'
        ? query.gte(cond.field, cond.value)
        : query.lte(cond.field, cond.value);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((m: { id: string }) => m.id);
}

// ─── Unified entry point ──────────────────────────────────────────────────────

export async function getMemberIdsForSegment(
  tenantId: string,
  segmentId: string
): Promise<string[]> {
  if (isCustomSegmentId(segmentId)) {
    return evaluateCustomSegment(tenantId, segmentId);
  }
  return resolveBuiltInSegment(tenantId, segmentId as SegmentId);
}

export async function getSegmentCount(tenantId: string, segmentId: string): Promise<number> {
  const ids = await getMemberIdsForSegment(tenantId, segmentId);
  return ids.length;
}
