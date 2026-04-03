'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@loyalty-os/lib';
import type { TransactionItem } from '@/lib/member/types';

export function useTransactions(memberId: string | null, limit = 20) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;

    async function fetchTransactions() {
      setLoading(true);
      const supabase = getSupabaseClient();

      const { data, error: dbError } = await supabase
        .from('transactions')
        .select('id, type, points, points_balance, description, created_at')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!cancelled) {
        if (dbError) {
          setError(dbError.message);
        } else {
          setTransactions((data ?? []) as TransactionItem[]);
        }
        setLoading(false);
      }
    }

    fetchTransactions();
    return () => {
      cancelled = true;
    };
  }, [memberId, limit]);

  return { transactions, loading, error };
}
