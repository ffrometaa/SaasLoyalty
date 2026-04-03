'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@loyalty-os/lib';
import Link from 'next/link';

type Step = 'email' | 'sent';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');

  // Read tenant cookie on mount for back-link
  useEffect(() => {
    const match = document.cookie.match(/loyalty_tenant=([^;]+)/);
    if (match) setTenantSlug(match[1]);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    const supabase = getSupabaseClient();
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: callbackUrl,
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (authError) {
      setError('Hubo un problema al enviar el email. Intentá de nuevo.');
      return;
    }

    setStep('sent');
  }

  if (step === 'sent') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--cream, #faf8f4)' }}>
        <div className="w-full max-w-sm text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--sage-light, #eef0eb)', border: '2px solid var(--sage, #7d8c6e)' }}
          >
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="var(--sage-dark, #4a5440)" strokeWidth="1.5">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1
            className="mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: 'var(--text, #2c2c2a)' }}
          >
            Revisá tu email
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--muted, #8a887f)' }}>
            Enviamos un link de acceso a{' '}
            <strong style={{ color: 'var(--text, #2c2c2a)' }}>{email}</strong>.
            Tocá el link para ingresar.
          </p>

          <p className="text-xs mb-6" style={{ color: 'var(--muted, #8a887f)' }}>
            ¿No llegó? Revisá la carpeta de spam o{' '}
            <button
              onClick={() => { setStep('email'); setError(''); }}
              className="underline"
              style={{ color: 'var(--sage-dark, #4a5440)' }}
            >
              intentá de nuevo
            </button>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--cream, #faf8f4)' }}>
      <div className="w-full max-w-sm">
        {/* Back link */}
        {tenantSlug && (
          <Link
            href={`/join/${tenantSlug}`}
            className="flex items-center gap-1.5 text-sm mb-8"
            style={{ color: 'var(--muted, #8a887f)' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </Link>
        )}

        {/* Header */}
        <h1
          className="mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--text, #2c2c2a)' }}
        >
          Ingresá tu email
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted, #8a887f)' }}>
          Te mandamos un link para acceder sin contraseña.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              autoFocus
              required
              className="w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all"
              style={{
                background: 'white',
                border: '1px solid var(--border, #e8e4dc)',
                color: 'var(--text, #2c2c2a)',
              }}
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
            disabled={loading || !email.trim()}
            className="w-full py-4 rounded-[14px] text-[15px] font-medium text-white flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: 'var(--sage-dark, #4a5440)',
              opacity: loading || !email.trim() ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando...
              </>
            ) : (
              'Continuar con email'
            )}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--muted, #8a887f)' }}>
          Al continuar aceptás los{' '}
          <Link href="/terms" className="underline">términos de servicio</Link>
          {' '}y la{' '}
          <Link href="/privacy" className="underline">política de privacidad</Link>.
        </p>
      </div>
    </main>
  );
}
