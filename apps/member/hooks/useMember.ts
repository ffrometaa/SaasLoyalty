'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@loyalty-os/lib';
import type { MemberProfile } from '@/lib/member/types';

export function useMember() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMember() {
      const supabase = getSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setError('not_authenticated');
          setLoading(false);
        }
        return;
      }

      const { data, error: dbError } = await supabase
        .from('members')
        .select(`
          id, tenant_id, name, email, tier,
          points_balance, points_lifetime, member_code, first_name, last_name,
          tenant:tenants!inner (
            id, business_name, brand_app_name, brand_logo_url,
            brand_color_primary, brand_color_secondary, slug
          )
        `)
        .eq('auth_user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!cancelled) {
        if (dbError || !data) {
          setError('member_not_found');
        } else {
          setMember(data as unknown as MemberProfile);
        }
        setLoading(false);
      }
    }

    fetchMember();
    return () => {
      cancelled = true;
    };
  }, []);

  return { member, loading, error };
}
