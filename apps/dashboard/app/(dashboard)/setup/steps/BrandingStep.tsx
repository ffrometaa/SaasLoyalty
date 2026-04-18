'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface BrandingStepProps {
  prefill: { primaryColor: string; plan: string };
  onComplete: () => void;
  onSkip: () => void;
}

export function BrandingStep({ prefill, onComplete, onSkip }: BrandingStepProps) {
  const t = useTranslations('setupWizard.branding');
  const tNav = useTranslations('setupWizard.nav');

  const [primaryColor, setPrimaryColor] = useState(prefill.primaryColor);
  const [accentColor, setAccentColor] = useState('#818cf8');
  const [loading, setLoading] = useState(false);

  const isStarterPlan = prefill.plan === 'starter';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primaryColor, accentColor }),
    });

    setLoading(false);
    onComplete();
  }

  if (isStarterPlan) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-5">{t('heading')}</h2>

        <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-4 mb-6">
          <p className="text-sm text-indigo-700 mb-3">{t('upsell')}</p>
          <Link
            href="/settings?tab=billing"
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            {t('upgrade')} →
          </Link>
        </div>

        <div className="flex justify-between items-center">
          <span />
          <button
            type="button"
            onClick={onSkip}
            className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            {tNav('skip')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold text-gray-900 mb-5">{t('heading')}</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
            {t('primaryColorLabel')}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-sm text-gray-500">{primaryColor}</span>
          </div>
        </div>

        <div>
          <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 mb-1">
            {t('accentColorLabel')}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="accentColor"
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-sm text-gray-500">{accentColor}</span>
          </div>
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
