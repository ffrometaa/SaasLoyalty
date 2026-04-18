'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface BusinessProfileStepProps {
  prefill: { businessName: string };
  onComplete: () => void;
  onSkip: () => void;
}

export function BusinessProfileStep({ prefill, onComplete, onSkip }: BusinessProfileStepProps) {
  const t = useTranslations('setupWizard.businessProfile');
  const tNav = useTranslations('setupWizard.nav');

  const [businessName, setBusinessName] = useState(prefill.businessName);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!businessName.trim()) {
      setError(t('nameRequired'));
      return;
    }

    setError('');
    setLoading(true);

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: businessName.trim(),
        businessPhone: phone.trim() || undefined,
        businessAddress: address.trim() || undefined,
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
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
            {t('nameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={e => { setBusinessName(e.target.value); setError(''); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            {t('phoneLabel')}
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            {t('addressLabel')}
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
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
