'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@loyalty-os/lib';

export default function AuthRecoveryPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    async function handle() {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (type !== 'recovery' || !accessToken || !refreshToken) {
        setError('Link inválido o expirado.');
        return;
      }

      const supabase = getSupabaseClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError('El link expiró o ya fue usado. Solicitá uno nuevo.');
        return;
      }

      router.replace('/auth/reset');
    }

    handle();
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--cream, #faf8f4)' }}>
        <div className="w-full max-w-sm text-center">
          <p className="text-sm px-4 py-3 rounded-lg mb-6" style={{ background: '#fef2f2', color: '#dc2626' }}>
            {error}
          </p>
          <a href="/forgot-password" className="text-sm underline" style={{ color: 'var(--sage-dark, #4a5440)' }}>
            Solicitar nuevo link
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--cream, #faf8f4)' }}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--sage-dark, #4a5440)', borderTopColor: 'transparent' }} />
    </main>
  );
}
