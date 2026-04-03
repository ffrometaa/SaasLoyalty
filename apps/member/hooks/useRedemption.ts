'use client';

import { useState } from 'react';
import { createRedemption } from '@/lib/member/actions';
import type { RedemptionResult } from '@/lib/member/types';

export function useRedemption() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedemptionResult | null>(null);

  async function redeem(
    rewardId: string,
    memberId: string
  ): Promise<RedemptionResult | null> {
    setLoading(true);
    setError(null);

    const response = await createRedemption(rewardId, memberId);

    if (response.success) {
      setResult(response.data);
      setLoading(false);
      return response.data;
    } else {
      setError(response.error);
      setLoading(false);
      return null;
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { redeem, loading, error, result, reset };
}
