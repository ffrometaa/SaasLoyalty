'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@loyalty-os/lib';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
              <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="auth-title mt-4">{t('successTitle')}</h2>
            <p className="auth-subtitle mt-2">
              {t('successSubtitle')} <strong className="text-white">{email}</strong>
            </p>
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('notReceived')}{' '}
              <button onClick={() => setSuccess(false)} className="auth-link font-medium">
                {t('tryAgain')}
              </button>.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/login" className="auth-link">{t('backToSignIn')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center">
          <h2 className="auth-title">{t('title')}</h2>
          <p className="auth-subtitle">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error mt-4">{error}</div>
        )}

        <form className="auth-form mt-8" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="auth-label">{t('emailLabel')}</label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder={t('emailPlaceholder')}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? t('submitting') : t('submit')}
          </button>

          <div className="text-center">
            <Link href="/login" className="auth-link text-sm">{t('backToSignIn')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
