import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import type { CustomSegment } from './custom-segment-types';

export async function getCustomSegments(tenantId: string): Promise<CustomSegment[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tenant_custom_segments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CustomSegment[];
}

export async function getCustomSegmentById(
  tenantId: string,
  segmentId: string
): Promise<CustomSegment | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tenant_custom_segments')
    .select('*')
    .eq('id', segmentId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) return null;
  return data as CustomSegment;
}
