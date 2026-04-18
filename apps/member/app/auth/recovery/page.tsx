'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@loyalty-os/lib';

export default function AuthRecoveryPage() {
  const router = useRouter();
  const t = useTranslations('authRecovery');
  const [error, setError] = useState('');

  useEffect(() => {
    async function handle() {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (type !== 'recovery' || !accessToken || !refreshToken) {
        setError(t('invalidLink'));
        return;
      }

      const supabase = getSupabaseClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError(t('expiredDesc'));
        return;
      }

      router.replace('/auth/reset');
    }

    handle();
  }, [router, t]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0f' }}>
        <div className="w-full max-w-sm text-center">
          <p className="text-sm px-4 py-3 rounded-lg mb-6 bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </p>
          <a href="/forgot-password" className="text-sm underline text-[#a78bfa]">
            {t('requestNewLink')}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0a0a0f' }}>
      <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: 'rgba(124,58,237,0.3)', borderTopColor: '#7c3aed' }} />
    </main>
  );
}
