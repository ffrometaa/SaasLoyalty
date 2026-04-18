'use client';

import { useState } from 'react';
import { planHasFeature, getUpgradePlan, PLAN_CONFIGS } from '@/lib/plans/features';
import type { Plan, Feature } from '@/lib/plans/features';
import { useTranslations } from 'next-intl';
import { openBillingPortal } from '@/lib/billing/openBillingPortal';

interface FeatureGateProps {
  plan: Plan;
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  silent?: boolean;
  overridePlan?: Plan;
  trialHref?: string;
  /** When true, bypasses the gate entirely (active trial). */
  bypass?: boolean;
}

export function FeatureGate({
  plan,
  feature,
  children,
  fallback,
  silent = false,
  overridePlan,
  trialHref,
  bypass = false,
}: FeatureGateProps) {
  const t = useTranslations('upgrade');
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  async function handleUpgradeClick() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const result = await openBillingPortal();
      if ('url' in result) {
        window.location.href = result.url;
      } else if (result.error === 'no_stripe_customer') {
        setPortalError('Contact support@loyalbase.dev to upgrade your plan.');
      } else {
        setPortalError('Something went wrong. Please try again.');
      }
    } finally {
      setPortalLoading(false);
    }
  }

  // When overridePlan is provided (plan preview mode), use it instead of the real plan.
  const effectivePlan = overridePlan ?? plan;
  const hasAccess = bypass || planHasFeature(effectivePlan, feature);

  if (hasAccess) return <>{children}</>;

  if (silent) return null;

  if (fallback) return <>{fallback}</>;

  const upgradePlan = getUpgradePlan(effectivePlan);
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
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleUpgradeClick}
              disabled={portalLoading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#7c3aed] to-[#2563eb] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {portalLoading ? 'Opening...' : t('upgradeTo', { name: upgradeName })}
            </button>
            {portalError && (
              <p className="mt-2 text-xs text-center text-amber-700">{portalError}</p>
            )}
            {trialHref && (
              <a
                href={trialHref}
                className="text-xs text-white/60 hover:text-white/90 underline underline-offset-2 transition-colors"
              >
                {t('trialLinkText')}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="opacity-20 pointer-events-none select-none">{children}</div>
    </div>
  );
}
