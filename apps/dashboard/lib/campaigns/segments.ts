import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import type { SegmentId } from './segment-constants';

// Re-export constants so existing imports still work
export { SEGMENTS, type SegmentId, isValidSegment } from './segment-constants';

export async function getMemberIdsForSegment(
  tenantId: string,
  segmentId: SegmentId
): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const now = new Date();

  if (segmentId === 'birthday_month') {
    // Query all active members with a birthday and filter by month in JS
    const { data } = await supabase
      .from('members')
      .select('id, birthday')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .not('birthday', 'is', null);

    const month = now.getMonth() + 1;
    return (data ?? [])
      .filter((m: { id: string; birthday: string | null }) => m.birthday && new Date(m.birthday).getMonth() + 1 === month)
      .map((m: { id: string }) => m.id);
  }

  let query = supabase
    .from('members')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  if (segmentId === 'active') {
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('last_visit_at', cutoff);
  } else if (segmentId === 'at_risk') {
    const from = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('last_visit_at', to).gte('last_visit_at', from);
  } else if (segmentId === 'inactive') {
    const cutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('last_visit_at', cutoff);
  } else if (segmentId === 'tier_bronze') {
    query = query.eq('tier', 'bronze');
  } else if (segmentId === 'tier_silver') {
    query = query.eq('tier', 'silver');
  } else if (segmentId === 'tier_gold') {
    query = query.eq('tier', 'gold');
  } else if (segmentId === 'tier_platinum') {
    query = query.eq('tier', 'platinum');
  }
  // 'all' — no additional filter beyond tenant + active

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((m: { id: string }) => m.id);
}

export async function getSegmentCount(tenantId: string, segmentId: SegmentId): Promise<number> {
  const ids = await getMemberIdsForSegment(tenantId, segmentId);
  return ids.length;
}
