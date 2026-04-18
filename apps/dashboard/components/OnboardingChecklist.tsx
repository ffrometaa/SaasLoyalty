'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Circle } from 'lucide-react';

type ChecklistSteps = {
  profile_complete: boolean;
  reward_created: boolean;
  member_invited: boolean;
  reward_shared: boolean;
};

type ChecklistData = {
  steps: ChecklistSteps;
  allDone: boolean;
  isDismissed: boolean;
  planStatus: string;
  setupWizardCompleted: boolean;
};

const STEP_KEYS: (keyof ChecklistSteps)[] = [
  'profile_complete',
  'reward_created',
  'member_invited',
  'reward_shared',
];

export function OnboardingChecklist() {
  const t = useTranslations('onboarding');
  const tSetup = useTranslations('setupWizard');
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/onboarding-checklist')
      .then(r => r.ok ? r.json() : null)
      .then((json: ChecklistData | null) => {
        if (json) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDismiss() {
    await fetch('/api/onboarding-checklist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss' }),
    });
    setHidden(true);
  }

  async function handleCopyLink() {
    const shareUrl = `${window.location.origin}/rewards`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Mark reward_shared if not already done
    if (data && !data.steps.reward_shared) {
      await fetch('/api/onboarding-checklist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_shared' }),
      });
      setData(prev =>
        prev ? { ...prev, steps: { ...prev.steps, reward_shared: true } } : prev
      );
    }
  }

  // Don't render if hidden, dismissed, or all done
  if (hidden) return null;
  if (!loading && (!data || data.isDismissed || data.allDone)) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6 mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-64 mb-6" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-4">
            <div className="h-6 w-6 rounded-full bg-gray-200 shrink-0" />
            <div className="h-4 bg-gray-100 rounded flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-900">{t('title')}</h2>
        <button
          onClick={handleDismiss}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors ml-4 shrink-0"
        >
          {t('dismiss')}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-5">{t('subtitle')}</p>

      {/* Setup wizard CTA */}
      {!data.setupWizardCompleted && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3">
          <span className="text-sm font-medium text-indigo-700">
            {tSetup('launchCta')}
          </span>
          <Link
            href="/setup"
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            {tSetup('launchCta')} →
          </Link>
        </div>
      )}

      {/* Steps */}
      <ol className="space-y-3">
        {STEP_KEYS.map(key => {
          const done = data.steps[key];
          const stepLink = t(`stepLinks.${key}`);
          const isShareStep = key === 'reward_shared';

          return (
            <li key={key} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" aria-label="completed" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300 shrink-0" aria-label="incomplete" />
              )}
              <Link
                href={stepLink}
                className={`text-sm flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-700 hover:text-brand-purple'}`}
              >
                {t(`steps.${key}`)}
              </Link>
              {isShareStep && !done && (
                <button
                  onClick={handleCopyLink}
                  className="text-xs text-brand-purple hover:underline shrink-0"
                >
                  {copied ? t('copied') : t('copyLink')}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
