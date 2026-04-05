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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8 text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <a href="/forgot-password" className="text-sm text-purple-600 hover:underline">
            Solicitar nuevo link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
    </div>
  );
}
