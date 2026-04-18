'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface FirstRewardStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function FirstRewardStep({ onComplete, onSkip }: FirstRewardStepProps) {
  const t = useTranslations('setupWizard.firstReward');
  const tNav = useTranslations('setupWizard.nav');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [errors, setErrors] = useState<{ name?: string; pointsRequired?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = t('nameRequired');
    const pts = Number(pointsRequired);
    if (!pointsRequired || isNaN(pts) || pts <= 0) errs.pointsRequired = t('pointsRequired');
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

    await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        points_required: Number(pointsRequired),
        is_active: true,
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
          <label htmlFor="rewardName" className="block text-sm font-medium text-gray-700 mb-1">
            {t('nameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="rewardName"
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="rewardDescription" className="block text-sm font-medium text-gray-700 mb-1">
            {t('descriptionLabel')}
          </label>
          <textarea
            id="rewardDescription"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <div>
          <label htmlFor="pointsRequired" className="block text-sm font-medium text-gray-700 mb-1">
            {t('pointsLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="pointsRequired"
            type="number"
            min="1"
            value={pointsRequired}
            onChange={e => { setPointsRequired(e.target.value); setErrors(prev => ({ ...prev, pointsRequired: undefined })); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {errors.pointsRequired && (
            <p className="mt-1 text-xs text-red-600">{errors.pointsRequired}</p>
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
