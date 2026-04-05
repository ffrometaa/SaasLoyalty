'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@loyalty-os/lib';

type Step = 'code' | 'email' | 'register' | 'login';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const BIZ_CODE_KEY = 'loyalty_biz_code';

export default function JoinPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [code, setCode] = useState('');
  const [tenant, setTenant] = useState<{ id: string; name: string } | null>(null);

  // Step 2
  const [email, setEmail] = useState('');

  // Step 3 — register
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3 — login
  const [loginPassword, setLoginPassword] = useState('');

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auto-validate code or token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setLoading(true);
      fetch(`/api/invitations/${token}`)
        .then((res) => res.json())
        .then((data) => {
          setLoading(false);
          if (data.error) {
            setError(data.error);
            return;
          }
          if (data.email) setEmail(data.email);
          if (data.name) {
            const parts = data.name.split(' ');
            setFirstName(parts[0]);
            if (parts.length > 1) setLastName(parts.slice(1).join(' '));
          }
          if (data.joinCode) {
            setCode(data.joinCode);
            validateCode(data.joinCode, true);
          }
        })
        .catch(() => {
          setLoading(false);
          setError('Error validando la invitación.');
        });
      return;
    }

    const codeFromUrl = params.get('code')?.trim().toUpperCase();
    const codeFromStorage = localStorage.getItem(BIZ_CODE_KEY) ?? '';
    const initial = codeFromUrl ?? codeFromStorage;
    if (initial) {
      setCode(initial);
      validateCode(initial, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validateCode(value: string, silent = false) {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    if (!silent) setLoading(true);
    setError('');
    const res = await fetch(`/api/auth/validate-code?code=${encodeURIComponent(trimmed)}`);
    const data = await res.json();
    if (!silent) setLoading(false);
    if (!data.valid) {
      localStorage.removeItem(BIZ_CODE_KEY);
      setError('Código inválido. Verificá con tu negocio.');
      return;
    }
    localStorage.setItem(BIZ_CODE_KEY, trimmed);
    // Persist tenant_id in a cookie so Server Components can read it
    document.cookie = `loyalty_tenant_id=${data.tenantId}; path=/; max-age=2592000; SameSite=Lax`;
    setTenant({ id: data.tenantId, name: data.tenantName });
    setStep('email');
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    await validateCode(code);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !tenant) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), tenantId: tenant.id }),
    });
    const data = await res.json();
    setLoading(false);
    // 'new_user' → register | 'existing_user_new_tenant' | 'existing_member' → login
    setStep(data.status === 'new_user' ? 'register' : 'login');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = getSupabaseClient();
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          // Store tenantId in metadata for email confirmation flow
          tenant_id: tenant!.id,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? 'Ya tenés una cuenta con este email. Ingresá tu contraseña.'
        : signUpError.message);
      setLoading(false);
      if (signUpError.message === 'User already registered') setStep('login');
      return;
    }

    // Create member record — pass access token directly to avoid cookie race condition
    await fetch('/api/auth/create-member', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signUpData.session?.access_token
          ? { Authorization: `Bearer ${signUpData.session.access_token}` }
          : {}),
      },
      body: JSON.stringify({
        tenantId: tenant!.id,
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        phone: phone.trim() || null,
        birthMonth: birthMonth ? parseInt(birthMonth) : null,
        birthDay: birthDay ? parseInt(birthDay) : null,
      }),
    });

    setLoading(false);
    router.push('/');
    router.refresh();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = getSupabaseClient();
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: loginPassword,
    });

    if (loginError) {
      setError('Contraseña incorrecta.');
      setLoading(false);
      return;
    }

    // Pass access token directly — avoids cookie race condition right after sign-in
    const memberRes = await fetch('/api/auth/create-member', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(loginData.session?.access_token
          ? { Authorization: `Bearer ${loginData.session.access_token}` }
          : {}),
      },
      body: JSON.stringify({ tenantId: tenant!.id }),
    });

    if (!memberRes.ok) {
      const err = await memberRes.json().catch(() => ({}));
      setError(`Error al crear tu perfil: ${err.error ?? memberRes.status}`);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/');
    router.refresh();
  }

  // ─── STYLES ──────────────────────────────────────────────────────────────────

  const inputClass = [
    'w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all',
    'bg-white/5 border border-white/10 text-white placeholder:text-white/30',
    'focus:border-[#7c3aed]/60 focus:bg-white/8',
  ].join(' ');

  const selectClass = inputClass + ' appearance-none';

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

  const BackBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm mb-8 text-white/40 hover:text-white/70 transition-colors"
    >
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Volver
    </button>
  );

  const TenantChip = () => tenant ? (
    <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl bg-white/5 border border-white/10 w-fit">
      <span className="text-xs text-white/40">Negocio:</span>
      <span className="text-sm font-medium text-white">{tenant.name}</span>
    </div>
  ) : null;

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#0a0a0f' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
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
            {tenant?.name ?? 'Bienvenido'}
          </h1>
          {!tenant && (
            <p className="text-sm mt-2 text-white/45">
              Ingresá el código de tu negocio para comenzar
            </p>
          )}
        </div>

        {/* ── STEP 1: Business code ── */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                Código del negocio
              </label>
              <input
                ref={codeInputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABC12345"
                autoCapitalize="characters"
                autoComplete="off"
                required
                className={inputClass}
                style={{ letterSpacing: '0.1em', fontWeight: 600 }}
              />
              <p className="text-xs mt-1.5 text-white/35">
                Pedíselo al negocio o escaneá su código QR
              </p>
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !code.trim()} className={btnClass}
              style={{ ...btnStyle, opacity: loading || !code.trim() ? 0.6 : 1 }}>
              {loading ? <><Spinner /> Verificando...</> : 'Continuar'}
            </button>
          </form>
        )}

        {/* ── STEP 2: Email ── */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <BackBtn onClick={() => { setStep('code'); setError(''); }} />
            <TenantChip />

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

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !email.trim()} className={btnClass}
              style={{ ...btnStyle, opacity: loading || !email.trim() ? 0.6 : 1 }}>
              {loading ? <><Spinner /> Verificando...</> : 'Continuar'}
            </button>
          </form>
        )}

        {/* ── STEP 3a: Register ── */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <BackBtn onClick={() => { setStep('email'); setError(''); }} />
            <TenantChip />

            <p className="text-sm mb-2 text-white/45">
              Completá tus datos para crear tu cuenta
            </p>

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/70">
                  Nombre *
                </label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ana" autoComplete="given-name" required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/70">
                  Apellido
                </label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="García" autoComplete="family-name" className={inputClass} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                Teléfono <span className="text-white/35 font-normal">(opcional)</span>
              </label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0000" autoComplete="tel" className={inputClass} />
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                Cumpleaños <span className="text-white/35 font-normal">(para ofertas especiales)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={selectClass}>
                  <option value="">Mes</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
                <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className={selectClass}>
                  <option value="">Día</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                Contraseña *
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" autoComplete="new-password" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                Confirmá la contraseña *
              </label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" autoComplete="new-password" required className={inputClass} />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !firstName.trim() || !password || !confirmPassword}
              className={btnClass} style={{ ...btnStyle, opacity: loading || !firstName.trim() || !password || !confirmPassword ? 0.6 : 1 }}>
              {loading ? <><Spinner /> Creando cuenta...</> : 'Crear cuenta'}
            </button>

            <p className="text-xs text-center text-white/30">
              Al registrarte aceptás los{' '}
              <a href="https://loyalbase.dev/terms" target="_blank" rel="noopener noreferrer" className="underline text-[#a78bfa]">
                Términos de servicio
              </a>
              {' '}y la{' '}
              <a href="https://loyalbase.dev/privacy" target="_blank" rel="noopener noreferrer" className="underline text-[#a78bfa]">
                Política de privacidad
              </a>.
            </p>
          </form>
        )}

        {/* ── STEP 3b: Login ── */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <BackBtn onClick={() => { setStep('email'); setError(''); setLoginPassword(''); }} />
            <TenantChip />

            <div className="px-4 py-3 rounded-xl mb-2 bg-white/5 border border-white/10">
              <p className="text-xs text-white/40">Iniciando sesión como</p>
              <p className="text-sm font-medium text-white">{email}</p>
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
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password" autoFocus required className={inputClass} />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !loginPassword} className={btnClass}
              style={{ ...btnStyle, opacity: loading || !loginPassword ? 0.6 : 1 }}>
              {loading ? <><Spinner /> Ingresando...</> : 'Ingresar'}
            </button>
          </form>
        )}

      </div>
    </main>
  );
}
