'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@loyalty-os/lib';
import { ConsentCheckbox } from '@/components/consent-checkbox';
import { QrScannerModal } from '@/components/qr-scanner-modal';

type Step = 'code' | 'email' | 'register' | 'login';

const BIZ_CODE_KEY = 'loyalty_biz_code';

export default function JoinPage() {
  const t = useTranslations('join_page');

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

  // QR scanner
  const [showScanner, setShowScanner] = useState(false);

  // Consent
  const [consented, setConsented] = useState(false);
  const [documentIds, setDocumentIds] = useState<string[]>([]);

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
          setError(t('error_invitation'));
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

  // Fetch pending document IDs when entering the register step
  useEffect(() => {
    if (step !== 'register') return;
    fetch('/api/consent')
      .then((res) => res.json())
      .then((data) => {
        if (data.pending?.length) {
          setDocumentIds(data.pending.map((d: { document_id: string }) => d.document_id));
        } else {
          setDocumentIds([]);
          setConsented(true);
        }
      })
      .catch(() => {
        setConsented(true);
      });
  }, [step]);

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
      setError(t('error_invalid_code'));
      return;
    }
    localStorage.setItem(BIZ_CODE_KEY, trimmed);
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
    setStep(data.status === 'new_user' ? 'register' : 'login');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('error_password_mismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('error_password_min'));
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
          tenant_id: tenant!.id,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? t('error_already_registered')
        : signUpError.message);
      setLoading(false);
      if (signUpError.message === 'User already registered') setStep('login');
      return;
    }

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

    if (documentIds.length > 0 && signUpData.session?.access_token) {
      await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${signUpData.session.access_token}`,
        },
        body: JSON.stringify({ document_ids: documentIds }),
      }).catch(() => {});
    }

    setLoading(false);
    window.location.href = '/';
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
      setError(t('error_wrong_password'));
      setLoading(false);
      return;
    }

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
      setError(`${t('error_profile')}${err.error ?? memberRes.status}`);
      setLoading(false);
      return;
    }

    setLoading(false);
    window.location.href = '/';
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
      {t('back')}
    </button>
  );

  const TenantChip = () => tenant ? (
    <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl bg-white/5 border border-white/10 w-fit">
      <span className="text-xs text-white/40">{t('business_label')}:</span>
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
            {tenant?.name ?? t('welcome')}
          </h1>
          {!tenant && (
            <p className="text-sm mt-2 text-white/45">
              {t('welcome_subtitle')}
            </p>
          )}
        </div>

        {/* QR scanner modal */}
        {showScanner && (
          <QrScannerModal
            onScan={(scanned) => {
              setShowScanner(false);
              setCode(scanned);
              validateCode(scanned);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* ── STEP 1: Business code ── */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                {t('code_label')}
              </label>
              <div className="relative flex items-center gap-2">
                <input
                  ref={codeInputRef}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t('code_placeholder')}
                  autoCapitalize="characters"
                  autoComplete="off"
                  required
                  className={inputClass}
                  style={{ letterSpacing: '0.1em', fontWeight: 600 }}
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex-shrink-0 flex items-center justify-center w-[52px] h-[52px] rounded-[14px] border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label={t('scan_button')}
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 8V5a2 2 0 012-2h3M3 16v3a2 2 0 002 2h3M16 3h3a2 2 0 012 2v3M16 21h3a2 2 0 002-2v-3" />
                    <rect x="7" y="7" width="4" height="4" rx="0.5" />
                    <rect x="13" y="7" width="4" height="4" rx="0.5" />
                    <rect x="7" y="13" width="4" height="4" rx="0.5" />
                    <path strokeLinecap="round" d="M13 13h1v1M15 13h2v2h-1M13 15h1v2h2" />
                  </svg>
                </button>
              </div>
              <p className="text-xs mt-1.5 text-white/35">
                {t('code_hint')}
              </p>
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !code.trim()} className={btnClass}
              style={{ ...btnStyle, opacity: loading || !code.trim() ? 0.6 : 1 }}>
              {loading ? <><Spinner /> {t('verifying')}</> : t('continue')}
            </button>

            <p className="mt-5 text-center text-sm text-white/35">
              {t('have_account')}{' '}
              <a href="/login" className="underline text-[#a78bfa]">
                {t('sign_in_link')}
              </a>
            </p>
          </form>
        )}

        {/* ── STEP 2: Email ── */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <BackBtn onClick={() => { setStep('code'); setError(''); }} />
            <TenantChip />

            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                {t('email_label')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email_placeholder')}
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
              {loading ? <><Spinner /> {t('verifying')}</> : t('continue')}
            </button>
          </form>
        )}

        {/* ── STEP 3a: Register ── */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <BackBtn onClick={() => { setStep('email'); setError(''); }} />
            <TenantChip />

            <p className="text-sm mb-2 text-white/45">
              {t('register_subtitle')}
            </p>

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/70">
                  {t('first_name')} *
                </label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('first_name_placeholder')} autoComplete="given-name" required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/70">
                  {t('last_name')}
                </label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('last_name_placeholder')} autoComplete="family-name" className={inputClass} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                {t('phone')} <span className="text-white/35 font-normal">{t('phone_optional')}</span>
              </label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phone_placeholder')} autoComplete="tel" className={inputClass} />
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                {t('birthday')} <span className="text-white/35 font-normal">{t('birthday_hint')}</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={selectClass}>
                  <option value="">{t('birth_month')}</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((i) => (
                    <option key={i} value={String(i)}>{t(`months.${i}`)}</option>
                  ))}
                </select>
                <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className={selectClass}>
                  <option value="">{t('birth_day')}</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                {t('password')} *
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password_placeholder')} autoComplete="new-password" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white/70">
                {t('confirm_password')} *
              </label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirm_password_placeholder')} autoComplete="new-password" required className={inputClass} />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            {documentIds.length > 0 && (
              <ConsentCheckbox checked={consented} onChange={setConsented} />
            )}

            <button type="submit" disabled={loading || !firstName.trim() || !password || !confirmPassword || (documentIds.length > 0 && !consented)}
              className={btnClass} style={{ ...btnStyle, opacity: loading || !firstName.trim() || !password || !confirmPassword || (documentIds.length > 0 && !consented) ? 0.6 : 1 }}>
              {loading ? <><Spinner /> {t('creating')}</> : t('create_account')}
            </button>
          </form>
        )}

        {/* ── STEP 3b: Login ── */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <BackBtn onClick={() => { setStep('email'); setError(''); setLoginPassword(''); }} />
            <TenantChip />

            <div className="px-4 py-3 rounded-xl mb-2 bg-white/5 border border-white/10">
              <p className="text-xs text-white/40">{t('signing_in_as')}</p>
              <p className="text-sm font-medium text-white">{email}</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-white/70">
                  {t('password')}
                </label>
                <a href="/forgot-password" className="text-xs underline text-[#a78bfa]">
                  {t('forgot_password')}
                </a>
              </div>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t('confirm_password_placeholder')} autoComplete="current-password" autoFocus required className={inputClass} />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !loginPassword} className={btnClass}
              style={{ ...btnStyle, opacity: loading || !loginPassword ? 0.6 : 1 }}>
              {loading ? <><Spinner /> {t('signing_in')}</> : t('sign_in')}
            </button>
          </form>
        )}

      </div>
    </main>
  );
}
