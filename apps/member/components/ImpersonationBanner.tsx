'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@loyalty-os/lib';

export function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsImpersonating(sessionStorage.getItem('is_impersonating') === 'true');
  }, []);

  if (!isImpersonating) return null;

  async function handleEnd() {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('impersonation_token');

      if (token) {
        await fetch('/api/auth/impersonate', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }

      sessionStorage.removeItem('is_impersonating');
      sessionStorage.removeItem('impersonation_token');

      const supabase = getSupabaseClient();
      await supabase.auth.signOut();

      window.location.href = '/join';
    } catch (err) {
      console.error('[ImpersonationBanner] handleEnd error:', err);
      setLoading(false);
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 flex items-center justify-between text-sm font-medium">
      <span>⚠ Sesión de impersonación activa — estás viendo la app como este miembro</span>
      <button
        onClick={handleEnd}
        disabled={loading}
        className="ml-4 px-3 py-1 bg-white text-red-600 rounded text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-60"
      >
        {loading ? 'Terminando…' : 'Terminar sesión'}
      </button>
    </div>
  );
}
