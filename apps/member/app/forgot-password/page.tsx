'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLoading(false);
      setError(t('forgotPassword.errorGeneric'));
      return;
    }

    setLoading(false);
    setSent(true);
  }

  const darkInput = 'w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#7c3aed]/60';
  const gradientBtn = { background: 'linear-gradient(135deg, #e11d48, #7c3aed)' };

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0f' }}>
        <div className="w-full max-w-sm text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(124,58,237,0.15)', border: '2px solid rgba(124,58,237,0.3)' }}
          >
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1
            className="mb-2 text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            {t('forgotPassword.checkEmail')}
          </h1>
          <p className="text-sm leading-relaxed mb-8 text-white/45">
            {t('forgotPassword.checkEmailDesc', { email })}
          </p>
          <Link
            href="/login"
            className="text-sm underline text-[#a78bfa]"
          >
            {t('backToLogin')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm mb-8 text-white/40 hover:text-white/70 transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('back')}
        </Link>

        <h1
          className="mb-2 text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          {t('forgotPassword.title')}
        </h1>
        <p className="text-sm mb-8 text-white/45">
          {t('forgotPassword.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white/70">
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
              className={darkInput}
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-4 rounded-[14px] text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
            style={{ ...gradientBtn, opacity: loading || !email.trim() ? 0.6 : 1 }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('forgotPassword.submitting')}
              </>
            ) : (
              t('forgotPassword.submit')
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
