'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@loyalty-os/lib';
import type { RewardItem } from '@/lib/member/types';

export function useRewards(tenantId: string | null, memberPoints: number) {
  const [available, setAvailable] = useState<RewardItem[]>([]);
  const [locked, setLocked] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    async function fetchRewards() {
      setLoading(true);
      const supabase = getSupabaseClient();

      const { data, error: dbError } = await supabase
        .from('rewards')
        .select(
          'id, tenant_id, name, description, image_url, category, points_cost, monetary_value, is_active, valid_days, min_tier, max_per_member, sort_order'
        )
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
        .order('points_cost', { ascending: true });

      if (!cancelled) {
        if (dbError) {
          setError(dbError.message);
        } else {
          const rewards = (data ?? []) as RewardItem[];
          setAvailable(rewards.filter((r) => r.points_cost <= memberPoints));
          setLocked(rewards.filter((r) => r.points_cost > memberPoints));
        }
        setLoading(false);
      }
    }

    fetchRewards();
    return () => {
      cancelled = true;
    };
  }, [tenantId, memberPoints]);

  return { available, locked, loading, error };
}
