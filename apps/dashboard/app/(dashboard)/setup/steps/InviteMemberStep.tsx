'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface InviteMemberStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function InviteMemberStep({ onComplete, onSkip }: InviteMemberStepProps) {
  const t = useTranslations('setupWizard.inviteMember');
  const tNav = useTranslations('setupWizard.nav');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setNameError(t('nameRequired'));
      return;
    }

    setNameError('');
    setApiError('');
    setLoading(true);

    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setApiError(body.error ?? 'Failed to add member');
      return;
    }

    onComplete();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="text-lg font-semibold text-gray-900 mb-5">{t('heading')}</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-1">
            {t('nameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="memberName"
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(''); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="memberEmail" className="block text-sm font-medium text-gray-700 mb-1">
            {t('emailLabel')}
          </label>
          <input
            id="memberEmail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label htmlFor="memberPhone" className="block text-sm font-medium text-gray-700 mb-1">
            {t('phoneLabel')}
          </label>
          <input
            id="memberPhone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {apiError && (
          <p className="text-sm text-red-600">{apiError}</p>
        )}
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
          {loading ? '...' : tNav('finish')}
        </button>
      </div>
    </form>
  );
}
