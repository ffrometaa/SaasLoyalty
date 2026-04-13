'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@loyalty-os/lib';

export default function AuthResetPage() {
  const router = useRouter();
  const t = useTranslations('authReset');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setError(t('errorMinLength'));
      return;
    }
    if (password !== confirm) {
      setError(t('errorMismatch'));
      return;
    }

    setLoading(true);
    setError('');

    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(t('errorGeneric'));
      return;
    }

    router.push('/');
    router.refresh();
  }

  const darkInput = 'w-full px-4 py-3.5 rounded-[14px] text-base outline-none transition-all bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#7c3aed]/60';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-sm">
        <h1
          className="mb-2 text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          {t('title')}
        </h1>
        <p className="text-sm mb-8 text-white/45">
          {t('subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white/70">
              {t('passwordLabel')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              autoComplete="new-password"
              minLength={8}
              autoFocus
              required
              className={darkInput}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-white/70">
              {t('confirmLabel')}
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('confirmPlaceholder')}
              autoComplete="new-password"
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
            disabled={loading || !password || !confirm}
            className="w-full py-4 rounded-[14px] text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #e11d48, #7c3aed)',
              opacity: loading || !password || !confirm ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('submitting')}
              </>
            ) : (
              t('submit')
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
