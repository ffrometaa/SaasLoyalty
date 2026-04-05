'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@loyalty-os/lib';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');

  useEffect(() => {
    const fromParam = searchParams.get('tenant');
    if (fromParam) {
      setTenantSlug(fromParam);
      document.cookie = `loyalty_tenant=${fromParam}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    } else {
      const match = document.cookie.match(/loyalty_tenant=([^;]+)/);
      if (match) setTenantSlug(match[1]);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError('');

    const supabase = getSupabaseClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (authError) {
      if (authError.status === 400) {
        setError(t('login.errorInvalid'));
      } else if (authError.status === 429) {
        setError(t('login.errorTooMany'));
      } else {
        setError(t('login.errorGeneric'));
      }
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--cream, #faf8f4)' }}>
      <div className="w-full max-w-sm">
        {tenantSlug && (
          <Link
            href={`/join/${tenantSlug}`}
            className="flex items-center gap-1.5 text-sm mb-8"
            style={{ color: 'var(--muted, #8a887f)' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t('back')}
          </Link>
        )}

        <h1
          className="mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--text, #2c2c2a)' }}
        >
          {t('login.title')}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted, #8a887f)' }}>
          {t('login.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              autoComplete="email"
              autoFocus
              required
              className="w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all"
              style={{ background: 'white', border: '1px solid var(--border, #e8e4dc)', color: 'var(--text, #2c2c2a)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border, #e8e4dc)')}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text, #2c2c2a)' }}>
                {t('password')}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs underline"
                style={{ color: 'var(--sage-dark, #4a5440)' }}
              >
                {t('forgotPasswordLink')}
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all"
              style={{ background: 'white', border: '1px solid var(--border, #e8e4dc)', color: 'var(--text, #2c2c2a)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border, #e8e4dc)')}
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full py-4 rounded-[14px] text-[15px] font-medium text-white flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: 'var(--sage-dark, #4a5440)',
              opacity: loading || !email.trim() || !password ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('login.submitting')}
              </>
            ) : (
              t('login.submit')
            )}
          </button>

          {tenantSlug && (
            <p className="text-sm text-center" style={{ color: 'var(--muted, #8a887f)' }}>
              {t('login.noAccount')}{' '}
              <Link
                href={`/register?tenant=${tenantSlug}`}
                className="underline"
                style={{ color: 'var(--sage-dark, #4a5440)' }}
              >
                {t('login.register')}
              </Link>
            </p>
          )}
        </form>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--muted, #8a887f)' }}>
          {t('terms')}{' '}
          <a href="https://loyalbase.dev/terms" target="_blank" rel="noopener noreferrer" className="underline">
            {t('termsLink')}
          </a>
          {' '}{t('and')}{' '}
          <a href="https://loyalbase.dev/privacy" target="_blank" rel="noopener noreferrer" className="underline">
            {t('privacyLink')}
          </a>.
        </p>
      </div>
    </main>
  );
}
