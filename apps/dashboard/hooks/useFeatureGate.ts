import { useCallback } from 'react';
import { planHasFeature, canAddMember, canCreateCampaign } from '@/lib/plans/features';
import type { Plan, Feature } from '@/lib/plans/features';

interface UseFeatureGateProps {
  plan: Plan;
  currentMemberCount?: number;
  campaignsThisMonth?: number;
}

export function useFeatureGate({
  plan,
  currentMemberCount = 0,
  campaignsThisMonth = 0,
}: UseFeatureGateProps) {
  const hasFeature = useCallback(
    (feature: Feature) => planHasFeature(plan, feature),
    [plan]
  );

  const memberLimitReached = useCallback(
    () => !canAddMember(plan, currentMemberCount),
    [plan, currentMemberCount]
  );

  const campaignLimitReached = useCallback(
    () => !canCreateCampaign(plan, campaignsThisMonth),
    [plan, campaignsThisMonth]
  );

  return {
    hasFeature,
    memberLimitReached,
    campaignLimitReached,
    plan,
  };
}
