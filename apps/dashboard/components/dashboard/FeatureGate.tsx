'use client';

import Link from 'next/link';
import { planHasFeature, getUpgradePlan, PLAN_CONFIGS } from '@/lib/plans/features';
import type { Plan, Feature } from '@/lib/plans/features';
import { useTranslations } from 'next-intl';

interface FeatureGateProps {
  plan: Plan;
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  silent?: boolean;
}

export function FeatureGate({
  plan,
  feature,
  children,
  fallback,
  silent = false,
}: FeatureGateProps) {
  const t = useTranslations('upgrade');
  const hasAccess = planHasFeature(plan, feature);

  if (hasAccess) return <>{children}</>;

  if (silent) return null;

  if (fallback) return <>{fallback}</>;

  const upgradePlan = getUpgradePlan(plan);
  const upgradeName = upgradePlan ? PLAN_CONFIGS[upgradePlan].name : null;

  return (
    <div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-6 overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-[2px] bg-black/40 flex flex-col items-center justify-center gap-4 z-10 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <div className="text-center px-4">
          <p className="text-white font-semibold text-sm mb-1">
            {upgradeName ? t('availableOn', { plan: upgradeName }) : t('premiumFeature')}
          </p>
          <p className="text-white/50 text-xs">{t('upgradeToUnlock')}</p>
        </div>

        {upgradePlan && (
          <Link
            href="/settings?tab=billing"
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#7c3aed] to-[#2563eb] hover:opacity-90 transition-opacity"
          >
            {t('upgradeTo', { name: upgradeName })}
          </Link>
        )}
      </div>

      <div className="opacity-20 pointer-events-none select-none">{children}</div>
    </div>
  );
}
