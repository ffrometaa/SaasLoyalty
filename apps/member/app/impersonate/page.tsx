'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@loyalty-os/lib';

export default function ImpersonatePage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      window.location.href = '/join';
      return;
    }

    async function startImpersonation() {
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.setSession({
        access_token: token!,
        refresh_token: token!,
      });

      if (error) {
        console.error('[impersonate] setSession error:', error);
        window.location.href = '/join';
        return;
      }

      sessionStorage.setItem('is_impersonating', 'true');
      sessionStorage.setItem('impersonation_token', token!);

      window.location.href = '/';
    }

    startImpersonation();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <p className="text-white text-sm">Iniciando sesión de impersonación…</p>
    </div>
  );
}
