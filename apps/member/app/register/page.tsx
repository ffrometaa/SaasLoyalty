'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@loyalty-os/lib';
import Link from 'next/link';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant') ?? '';
  const invitationToken = searchParams.get('token') ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [lockedEmail, setLockedEmail] = useState(false);

  // Persist tenant in cookie
  useEffect(() => {
    if (tenantSlug) {
      document.cookie = `loyalty_tenant=${tenantSlug}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    }
  }, [tenantSlug]);

  // Pre-fill from invitation token
  useEffect(() => {
    if (!invitationToken) return;
    fetch(`/api/invitations/${invitationToken}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.email) { setEmail(data.email); setLockedEmail(true); }
        if (data.name) setName(data.name);
      })
      .catch(() => {});
  }, [invitationToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) return;

    setLoading(true);
    setError('');

    const supabase = getSupabaseClient();
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=/`;

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: callbackUrl,
      },
    });

    setLoading(false);

    if (authError) {
      if (authError.status === 422) {
        setError('Este email ya tiene una cuenta. Inicia sesión.');
      } else if (authError.status === 429) {
        setError('Demasiados intentos. Espera un momento e intenta de nuevo.');
      } else {
        setError('Hubo un problema al crear tu cuenta. Intenta de nuevo.');
      }
      return;
    }

    setSent(true);
  }

  if (sent) {
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
            Revisa tu email
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--muted, #8a887f)' }}>
            Enviamos un link de confirmación a{' '}
            <strong style={{ color: 'var(--text, #2c2c2a)' }}>{email}</strong>.
            Toca el link para activar tu cuenta.
          </p>
          <p className="text-xs" style={{ color: 'var(--muted, #8a887f)' }}>
            ¿No llegó? Revisa la carpeta de spam o{' '}
            <button
              onClick={() => setSent(false)}
              className="underline"
              style={{ color: 'var(--sage-dark, #4a5440)' }}
            >
              intenta de nuevo
            </button>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--cream, #faf8f4)' }}>
      <div className="w-full max-w-sm">
        <Link
          href={tenantSlug ? `/join/${tenantSlug}` : '/login'}
          className="flex items-center gap-1.5 text-sm mb-8"
          style={{ color: 'var(--muted, #8a887f)' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </Link>

        <h1
          className="mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--text, #2c2c2a)' }}
        >
          Crear cuenta
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted, #8a887f)' }}>
          Completa los datos para unirte al programa de fidelidad.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              autoFocus
              required
              className="w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all"
              style={{ background: 'white', border: '1px solid var(--border, #e8e4dc)', color: 'var(--text, #2c2c2a)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border, #e8e4dc)')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => !lockedEmail && setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
              readOnly={lockedEmail}
              className="w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all"
              style={{
                background: lockedEmail ? '#f5f5f4' : 'white',
                border: '1px solid var(--border, #e8e4dc)',
                color: 'var(--text, #2c2c2a)',
              }}
              onFocus={(e) => !lockedEmail && (e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border, #e8e4dc)')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              minLength={8}
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
            disabled={loading || !name.trim() || !email.trim() || password.length < 8}
            className="w-full py-4 rounded-[14px] text-[15px] font-medium text-white flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: 'var(--sage-dark, #4a5440)',
              opacity: loading || !name.trim() || !email.trim() || password.length < 8 ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>

          <p className="text-sm text-center" style={{ color: 'var(--muted, #8a887f)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link
              href={`/login${tenantSlug ? `?tenant=${tenantSlug}` : ''}`}
              className="underline"
              style={{ color: 'var(--sage-dark, #4a5440)' }}
            >
              Inicia sesión
            </Link>
          </p>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--muted, #8a887f)' }}>
          Al continuar aceptas los{' '}
          <a href="https://loyalbase.dev/terms" target="_blank" rel="noopener noreferrer" className="underline">
            términos de servicio
          </a>
          {' '}y la{' '}
          <a href="https://loyalbase.dev/privacy" target="_blank" rel="noopener noreferrer" className="underline">
            política de privacidad
          </a>.
        </p>
      </div>
    </main>
  );
}
