'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface LoyaltyRulesStepProps {
  prefill: { pointsPerDollar: number; welcomeBonusPoints: number };
  onComplete: () => void;
  onSkip: () => void;
}

export function LoyaltyRulesStep({ prefill, onComplete, onSkip }: LoyaltyRulesStepProps) {
  const t = useTranslations('setupWizard.loyaltyRules');
  const tNav = useTranslations('setupWizard.nav');

  const [pointsPerDollar, setPointsPerDollar] = useState(String(prefill.pointsPerDollar));
  const [welcomeBonusPoints, setWelcomeBonusPoints] = useState(String(prefill.welcomeBonusPoints));
  const [errors, setErrors] = useState<{ pointsPerDollar?: string; welcomeBonusPoints?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: typeof errors = {};
    const ppd = Number(pointsPerDollar);
    const wbp = Number(welcomeBonusPoints);

    if (!pointsPerDollar || isNaN(ppd) || ppd <= 0) {
      errs.pointsPerDollar = t('invalidNumber');
    }
    if (!welcomeBonusPoints || isNaN(wbp) || wbp < 0) {
      errs.welcomeBonusPoints = t('invalidNumber');
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pointsPerDollar: Number(pointsPerDollar),
        welcomeBonusPoints: Number(welcomeBonusPoints),
      }),
    });

    setLoading(false);
    onComplete();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="text-lg font-semibold text-gray-900 mb-5">{t('heading')}</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="pointsPerDollar" className="block text-sm font-medium text-gray-700 mb-1">
            {t('pointsPerDollarLabel')}
          </label>
          <input
            id="pointsPerDollar"
            type="number"
            min="1"
            value={pointsPerDollar}
            onChange={e => { setPointsPerDollar(e.target.value); setErrors(prev => ({ ...prev, pointsPerDollar: undefined })); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {errors.pointsPerDollar && (
            <p className="mt-1 text-xs text-red-600">{errors.pointsPerDollar}</p>
          )}
        </div>

        <div>
          <label htmlFor="welcomeBonusPoints" className="block text-sm font-medium text-gray-700 mb-1">
            {t('welcomeBonusLabel')}
          </label>
          <input
            id="welcomeBonusPoints"
            type="number"
            min="0"
            value={welcomeBonusPoints}
            onChange={e => { setWelcomeBonusPoints(e.target.value); setErrors(prev => ({ ...prev, welcomeBonusPoints: undefined })); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {errors.welcomeBonusPoints && (
            <p className="mt-1 text-xs text-red-600">{errors.welcomeBonusPoints}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          {tNav('skip')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-purple-700 text-white text-sm font-medium hover:bg-purple-800 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : tNav('next')}
        </button>
      </div>
    </form>
  );
}
