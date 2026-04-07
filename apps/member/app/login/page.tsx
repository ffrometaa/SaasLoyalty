'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@loyalty-os/lib';

type Step = 'credentials' | 'picker';

interface Membership {
  memberId: string;
  tenantId: string;
  memberName: string;
  tier: string;
  pointsBalance: number;
  tenant: {
    id: string;
    business_name: string;
    brand_app_name: string | null;
    brand_logo_url: string | null;
    brand_color_primary: string | null;
  } | null;
}

function getCookieTenantId(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('loyalty_tenant_id='))
    ?.split('=')[1];
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [memberships, setMemberships] = useState<Membership[]>([]);

  const inputClass = [
    'w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all',
    'bg-white/5 border border-white/10 text-white placeholder:text-white/30',
    'focus:border-[#7c3aed]/60 focus:bg-white/8',
  ].join(' ');

  const btnClass = [
    'w-full py-4 rounded-[14px] text-[15px] font-semibold text-white',
    'flex items-center justify-center gap-2 transition-all',
  ].join(' ');

  const btnStyle = { background: 'linear-gradient(135deg, #e11d48, #7c3aed)' };

  const Spinner = () => (
    <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = getSupabaseClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (loginError) {
      setError('Email o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    // Fast path: already have a tenant cookie from a previous session
    const cookieTenantId = getCookieTenantId();
    if (cookieTenantId) {
      window.location.href = '/';
      return;
    }

    // Resolve which businesses this user belongs to
    const res = await fetch('/api/auth/my-tenants');
    const data = await res.json();
    const list: Membership[] = data.memberships ?? [];

    if (list.length === 0) {
      // Authenticated but no active memberships — send to join wizard
      window.location.href = '/join';
      return;
    }

    if (list.length === 1) {
      // Only one business — auto-select without showing picker
      document.cookie = `loyalty_tenant_id=${list[0].tenantId}; path=/; max-age=2592000; SameSite=Lax`;
      window.location.href = '/';
      return;
    }

    // Multiple businesses — show picker
    setMemberships(list);
    setLoading(false);
    setStep('picker');
  }

  function selectTenant(tenantId: string) {
    document.cookie = `loyalty_tenant_id=${tenantId}; path=/; max-age=2592000; SameSite=Lax`;
    window.location.href = '/';
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#0a0a0f' }}
    >
      <div className="w-full max-w-sm">

        {/* ── STEP 1: Email + password ── */}
        {step === 'credentials' && (
          <>
            <div className="mb-8 text-center">
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                Bienvenido
              </h1>
              <p className="text-sm mt-2 text-white/45">
                Iniciá sesión en tu programa de fidelización
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/70">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  autoFocus
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-white/70">
                    Contraseña
                  </label>
                  <a href="/forgot-password" className="text-xs underline text-[#a78bfa]">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className={btnClass}
                style={{ ...btnStyle, opacity: loading || !email.trim() || !password ? 0.6 : 1 }}
              >
                {loading ? <><Spinner /> Ingresando...</> : 'Ingresar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/35">
              ¿Primera vez?{' '}
              <a href="/join" className="underline text-[#a78bfa]">
                Ingresá el código de tu negocio
              </a>
            </p>
          </>
        )}

        {/* ── STEP 2: Business picker ── */}
        {step === 'picker' && (
          <>
            <div className="mb-8 text-center">
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                Elegí tu negocio
              </h1>
              <p className="text-sm mt-2 text-white/45">
                Pertenecés a {memberships.length} programas de fidelización
              </p>
            </div>

            <div className="space-y-3">
              {memberships.map((m) => {
                const displayName = m.tenant?.brand_app_name ?? m.tenant?.business_name ?? 'Negocio';
                const accentColor = m.tenant?.brand_color_primary ?? '#7c3aed';

                return (
                  <button
                    key={m.tenantId}
                    onClick={() => selectTenant(m.tenantId)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] text-left transition-all hover:scale-[1.01]"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {/* Logo or colored initial */}
                    <div
                      className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ background: accentColor + '33', border: `1px solid ${accentColor}55` }}
                    >
                      {m.tenant?.brand_logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.tenant.brand_logo_url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          className="text-xl font-bold"
                          style={{ color: accentColor }}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {m.pointsBalance.toLocaleString()} puntos · {m.tier}
                      </p>
                    </div>

                    <svg
                      className="shrink-0 text-white/30"
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-center text-sm text-white/35">
              ¿Nuevo negocio?{' '}
              <a href="/join" className="underline text-[#a78bfa]">
                Ingresá el código
              </a>
            </p>
          </>
        )}

      </div>
    </main>
  );
}
