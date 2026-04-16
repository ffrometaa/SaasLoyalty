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

      if (!accessToken || !refreshToken) {
        setError('Link inválido o expirado.');
        return;
      }

      interface AuthWithSetSession {
        setSession(tokens: { access_token: string; refresh_token: string }): Promise<{ error: Error | null }>;
      }
      const supabase = getSupabaseClient();
      const { error: sessionError } = await (supabase.auth as unknown as AuthWithSetSession).setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError('El link expiró o ya fue usado. Solicitá uno nuevo.');
        return;
      }

      if (type === 'recovery') {
        router.replace('/auth/reset');
      } else {
        router.replace('/');
      }
    }

    handle();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-brand-purple flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">LoyaltyOS</span>
          </div>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <a href="/forgot-password" className="text-sm text-brand-purple hover:text-brand-purple-700 transition-colors underline underline-offset-2">
              Solicitar nuevo link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
    </div>
  );
}
