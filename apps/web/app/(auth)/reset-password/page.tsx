'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@loyalty-os/lib';

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      setIsValidSession(!error && !!session);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) { setError(t('errTooShort')); return; }
    if (password !== confirmPassword) { setError(t('errMismatch')); return; }

    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push('/login'), 3000);
  };

  if (isValidSession === null) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent mx-auto" />
            <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(225,29,72,0.15)' }}>
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="auth-title mt-4">{t('invalidTitle')}</h2>
            <p className="auth-subtitle mt-2">{t('invalidSubtitle')}</p>
          </div>
          <div className="mt-6 text-center">
            <a href="/forgot-password" className="auth-link">{t('requestNew')}</a>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="auth-subtitle mt-2">{t('successSubtitle')}</p>
          </div>
          <div className="mt-6 p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p className="text-sm text-green-400">{t('redirecting')}</p>
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
            <label htmlFor="password" className="auth-label">{t('passwordLabel')}</label>
            <div className="mt-2">
              <input id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input" placeholder="••••••••" />
            </div>
            <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('passwordHint')}</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="auth-label">{t('confirmLabel')}</label>
            <div className="mt-2">
              <input id="confirmPassword" type="password" required value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
