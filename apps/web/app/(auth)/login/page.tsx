'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@loyalty-os/lib';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = 'https://dashboard.loyalbase.dev';
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center">
          <h2 className="auth-title">{t('title')}</h2>
          <p className="auth-subtitle">
            {t('subtitle')}{' '}
            <Link href="/register" className="auth-link">
              {t('subtitleLink')}
            </Link>
          </p>
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

          <div>
            <label htmlFor="password" className="auth-label">{t('passwordLabel')}</label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="auth-link text-sm">
              {t('forgotPassword')}
            </Link>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
