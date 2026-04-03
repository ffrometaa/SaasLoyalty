'use client';

import Link from 'next/link';
import { PLAN_CONFIGS, getUpgradePlan } from '@/lib/plans/features';
import type { Plan } from '@/lib/plans/features';

interface LimitWarningBannerProps {
  plan: Plan;
  type: 'members' | 'campaigns';
  current: number;
  warningThreshold?: number;
}

export function LimitWarningBanner({
  plan,
  type,
  current,
  warningThreshold = 80,
}: LimitWarningBannerProps) {
  const config = PLAN_CONFIGS[plan];
  const max = type === 'members' ? config.maxMembers : config.maxCampaignsPerMonth;

  if (max === null) return null;

  const percentage = Math.round((current / max) * 100);
  const isAtLimit = current >= max;
  const isNearLimit = percentage >= warningThreshold;

  if (!isNearLimit) return null;

  const upgradePlan = getUpgradePlan(plan);
  const upgradeName = upgradePlan ? PLAN_CONFIGS[upgradePlan].name : null;
  const label = type === 'members' ? 'members' : 'campaigns this month';

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-sm ${
        isAtLimit
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {isAtLimit ? (
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </>
          ) : (
            <>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </>
          )}
        </svg>
        <span>
          {isAtLimit
            ? `You've reached your limit of ${max} ${label}.`
            : `You've used ${current} of ${max} ${label} (${percentage}%).`}
          {isAtLimit && ' You cannot add more until you upgrade.'}
        </span>
      </div>
      {upgradePlan && (
        <Link
          href="/settings?tab=billing"
          className="whitespace-nowrap font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          Upgrade to {upgradeName}
        </Link>
      )}
    </div>
  );
}
