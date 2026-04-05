'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@loyalty-os/lib';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { lookupTenantByJoinCode } from '../../lib/member/joinCode';

// ─── BUSINESS PREVIEW CARD ────────────────────────────────────────────────────

function BusinessPreviewCard({
  businessName,
  logoUrl,
  brandColor,
}: {
  businessName: string;
  logoUrl: string | null;
  brandColor: string | null;
}) {
  const t = useTranslations('auth');
  const color = brandColor || '#4a5440';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-[14px] border"
      style={{ background: `${color}10`, borderColor: `${color}30` }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={businessName} className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
      ) : (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
          style={{ background: color }}
        >
          {businessName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: 'var(--muted, #8a887f)' }}>{t('joinCode.joiningBusiness')}</p>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text, #2c2c2a)' }}>{businessName}</p>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color, flexShrink: 0 }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams.get('token') ?? '';
  const codeParam = searchParams.get('code') ?? '';
  const tenantParam = searchParams.get('tenant') ?? ''; // legacy slug-based flow

  // ── Field states ─────────────────────────────────────────────────────────
  const [joinCode, setJoinCode] = useState(codeParam.toUpperCase());
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ── Tenant resolution ─────────────────────────────────────────────────────
  const [resolvedTenant, setResolvedTenant] = useState<{
    id: string;
    businessName: string;
    logoUrl: string | null;
    brandColor: string | null;
    slug: string;
  } | null>(null);
  const [joinCodeLocked, setJoinCodeLocked] = useState(false);
  const [joinCodeStatus, setJoinCodeStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  // ── Form state ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [lockedEmail, setLockedEmail] = useState(false);
  const [signupSource, setSignupSource] = useState<'invitation' | 'app'>('app');

  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── SCENARIO A: Arrived via invitation token ───────────────────────────────
  useEffect(() => {
    if (!tokenParam) return;
    setSignupSource('invitation');

    fetch(`/api/invitations/${tokenParam}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.email) { setEmail(data.email); setLockedEmail(true); }
        if (data.name) {
          const parts = (data.name as string).trim().split(' ');
          setFirstName(parts[0] ?? '');
          setLastName(parts.slice(1).join(' '));
        }
        if (data.joinCode) {
          const code = (data.joinCode as string).toUpperCase();
          setJoinCode(code);
          setJoinCodeLocked(true);
          setResolvedTenant({
            id: '',          // tenant id not needed on client for display
            businessName: data.businessName ?? '',
            logoUrl: data.logoUrl ?? null,
            brandColor: data.brandColor ?? null,
            slug: data.tenantSlug ?? '',
          });
          setJoinCodeStatus('found');
          // Set cookie so link-member can resolve the tenant
          document.cookie = `loyalty_join_code=${code}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
        }
        if (data.tenantSlug) {
          document.cookie = `loyalty_tenant=${data.tenantSlug}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
        }
      })
      .catch(() => {});
  }, [tokenParam]);

  // ── SCENARIO B: Arrived via ?code= param ──────────────────────────────────
  useEffect(() => {
    if (!codeParam || tokenParam) return; // token takes priority
    const code = codeParam.toUpperCase();
    setJoinCode(code);
    setJoinCodeStatus('loading');

    lookupTenantByJoinCode(code).then((tenant) => {
      if (tenant) {
        setResolvedTenant({
          id: tenant.id,
          businessName: tenant.business_name,
          logoUrl: tenant.brand_logo_url,
          brandColor: tenant.brand_color_primary,
          slug: tenant.slug,
        });
        setJoinCodeStatus('found');
        document.cookie = `loyalty_join_code=${code}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
        document.cookie = `loyalty_tenant=${tenant.slug}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
      } else {
        setJoinCodeStatus('not_found');
      }
    });
  }, [codeParam, tokenParam]);

  // ── Legacy slug flow (join/[slug] links) ──────────────────────────────────
  useEffect(() => {
    if (!tenantParam || tokenParam || codeParam) return;
    document.cookie = `loyalty_tenant=${tenantParam}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  }, [tenantParam, tokenParam, codeParam]);

  // ── SCENARIO C: Manual join code typing ──────────────────────────────────
  function handleJoinCodeChange(value: string) {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setJoinCode(upper);
    setResolvedTenant(null);

    if (upper.length < 6) {
      setJoinCodeStatus('idle');
      return;
    }

    setJoinCodeStatus('loading');
    if (lookupTimer.current) clearTimeout(lookupTimer.current);

    lookupTimer.current = setTimeout(async () => {
      const tenant = await lookupTenantByJoinCode(upper);
      if (tenant) {
        setResolvedTenant({
          id: tenant.id,
          businessName: tenant.business_name,
          logoUrl: tenant.brand_logo_url,
          brandColor: tenant.brand_color_primary,
          slug: tenant.slug,
        });
        setJoinCodeStatus('found');
        document.cookie = `loyalty_join_code=${upper}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
        document.cookie = `loyalty_tenant=${tenant.slug}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
      } else {
        setJoinCodeStatus('not_found');
      }
    }, 400);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!resolvedTenant && joinCodeStatus !== 'found') {
      setError(t('joinCode.joinCodeRequired'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('register.errorPasswordMismatch'));
      return;
    }

    setLoading(true);
    setError('');

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || email.split('@')[0];
    const supabase = getSupabaseClient();
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=/`;

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          signup_source: signupSource,
        },
        emailRedirectTo: callbackUrl,
      },
    });

    setLoading(false);

    if (authError) {
      if (authError.status === 422) {
        // Email already registered — try signing in and linking
        setLoading(true);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        setLoading(false);

        if (signInError) { setError(t('register.errorEmailExists')); return; }
        if (signInData?.session) {
          await fetch('/api/auth/link-member', { method: 'POST' });
          if (tokenParam) await fetch(`/api/invitations/${tokenParam}/accept`, { method: 'POST' });
          router.push('/');
          return;
        }
        setError(t('register.errorEmailExistsShort'));
        return;
      } else if (authError.status === 429) {
        setError(t('register.errorTooMany'));
      } else {
        setError(t('register.errorGeneric'));
      }
      return;
    }

    // Email confirmation disabled — session returned immediately
    if (data?.session) {
      await fetch('/api/auth/link-member', { method: 'POST' });
      if (tokenParam) await fetch(`/api/invitations/${tokenParam}/accept`, { method: 'POST' });
      router.push('/');
      return;
    }

    // Email confirmation enabled
    setSent(true);
  }

  // ── Derivations ───────────────────────────────────────────────────────────
  const canSubmit =
    joinCodeStatus === 'found' &&
    email.trim() !== '' &&
    password.length >= 8 &&
    password === confirmPassword &&
    termsAccepted &&
    !loading;

  const backHref = resolvedTenant?.slug
    ? `/join/${resolvedTenant.slug}`
    : tenantParam
    ? `/join/${tenantParam}`
    : '/login';

  // ── Sent screen ───────────────────────────────────────────────────────────
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
            {t('register.checkEmail')}
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--muted, #8a887f)' }}>
            {t('register.checkEmailDesc', { email })}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted, #8a887f)' }}>
            {t('register.noEmail')}{' '}
            <button onClick={() => setSent(false)} className="underline" style={{ color: 'var(--sage-dark, #4a5440)' }}>
              {t('register.tryAgain')}
            </button>.
          </p>
        </div>
      </main>
    );
  }

  // ── Register form ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10" style={{ background: 'var(--cream, #faf8f4)' }}>
      <div className="w-full max-w-sm">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm mb-8"
          style={{ color: 'var(--muted, #8a887f)' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('back')}
        </Link>

        <h1
          className="mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--text, #2c2c2a)' }}
        >
          {t('register.title')}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted, #8a887f)' }}>
          {t('register.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── JOIN CODE ── */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              {t('joinCode.joinCode')} *
            </label>
            <div className="relative">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => !joinCodeLocked && handleJoinCodeChange(e.target.value)}
                placeholder={t('joinCode.joinCodePlaceholder')}
                maxLength={6}
                readOnly={joinCodeLocked}
                autoComplete="off"
                className="w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all font-mono tracking-widest uppercase"
                style={{
                  background: joinCodeLocked ? '#f5f5f4' : 'white',
                  border: `1px solid ${
                    joinCodeStatus === 'found'
                      ? '#16a34a'
                      : joinCodeStatus === 'not_found'
                      ? '#dc2626'
                      : 'var(--border, #e8e4dc)'
                  }`,
                  color: 'var(--text, #2c2c2a)',
                }}
                onFocus={(e) => {
                  if (!joinCodeLocked && joinCodeStatus !== 'found' && joinCodeStatus !== 'not_found') {
                    e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)';
                  }
                }}
                onBlur={(e) => {
                  if (joinCodeStatus === 'idle') e.currentTarget.style.borderColor = 'var(--border, #e8e4dc)';
                }}
              />
              {joinCodeStatus === 'loading' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#4a5440" strokeWidth="4" />
                    <path className="opacity-75" fill="#4a5440" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              )}
            </div>

            {/* Status feedback */}
            {joinCodeStatus === 'loading' && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted, #8a887f)' }}>
                {t('joinCode.joinCodeLooking')}
              </p>
            )}
            {joinCodeStatus === 'not_found' && (
              <p className="text-xs mt-1.5" style={{ color: '#dc2626' }}>
                {t('joinCode.joinCodeNotFound')}
              </p>
            )}

            {/* Business preview card */}
            {joinCodeStatus === 'found' && resolvedTenant && (
              <div className="mt-2">
                <BusinessPreviewCard
                  businessName={resolvedTenant.businessName}
                  logoUrl={resolvedTenant.logoUrl}
                  brandColor={resolvedTenant.brandColor}
                />
              </div>
            )}
          </div>

          {/* ── FIRST NAME ── */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              {t('firstName')}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t('firstNamePlaceholder')}
              autoComplete="given-name"
              className="w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all"
              style={{ background: 'white', border: '1px solid var(--border, #e8e4dc)', color: 'var(--text, #2c2c2a)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border, #e8e4dc)')}
            />
          </div>

          {/* ── LAST NAME ── */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              {t('lastName')}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t('lastNamePlaceholder')}
              autoComplete="family-name"
              className="w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all"
              style={{ background: 'white', border: '1px solid var(--border, #e8e4dc)', color: 'var(--text, #2c2c2a)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border, #e8e4dc)')}
            />
          </div>

          {/* ── EMAIL ── */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              {t('email')} *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => !lockedEmail && setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
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

          {/* ── PHONE ── */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              {t('phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              autoComplete="tel"
              className="w-full px-4 py-3.5 rounded-[14px] text-sm outline-none transition-all"
              style={{ background: 'white', border: '1px solid var(--border, #e8e4dc)', color: 'var(--text, #2c2c2a)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border, #e8e4dc)')}
            />
          </div>

          {/* ── PASSWORD ── */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              {t('password')} *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full px-4 py-3.5 pr-12 rounded-[14px] text-sm outline-none transition-all"
                style={{ background: 'white', border: '1px solid var(--border, #e8e4dc)', color: 'var(--text, #2c2c2a)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border, #e8e4dc)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--muted, #8a887f)' }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ── CONFIRM PASSWORD ── */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text, #2c2c2a)' }}>
              {t('register.confirmPassword')} *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                autoComplete="new-password"
                required
                className="w-full px-4 py-3.5 pr-12 rounded-[14px] text-sm outline-none transition-all"
                style={{
                  background: 'white',
                  border: `1px solid ${confirmPassword && password !== confirmPassword ? '#dc2626' : 'var(--border, #e8e4dc)'}`,
                  color: 'var(--text, #2c2c2a)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sage-dark, #4a5440)')}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    confirmPassword && password !== confirmPassword ? '#dc2626' : 'var(--border, #e8e4dc)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--muted, #8a887f)' }}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{t('register.errorPasswordMismatch')}</p>
            )}
          </div>

          {/* ── TERMS ── */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
                style={{
                  background: termsAccepted ? 'var(--sage-dark, #4a5440)' : 'white',
                  borderColor: termsAccepted ? 'var(--sage-dark, #4a5440)' : 'var(--border, #e8e4dc)',
                }}
              >
                {termsAccepted && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs leading-relaxed" style={{ color: 'var(--muted, #8a887f)' }}>
              {t('terms')}{' '}
              <a href="https://loyalbase.dev/terms" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--sage-dark, #4a5440)' }}>
                {t('termsLink')}
              </a>
              {' '}{t('and')}{' '}
              <a href="https://loyalbase.dev/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--sage-dark, #4a5440)' }}>
                {t('privacyLink')}
              </a>.
            </span>
          </label>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 rounded-[14px] text-[15px] font-medium text-white flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: 'var(--sage-dark, #4a5440)',
              opacity: canSubmit ? 1 : 0.5,
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('register.submitting')}
              </>
            ) : (
              t('register.submit')
            )}
          </button>

          <p className="text-sm text-center" style={{ color: 'var(--muted, #8a887f)' }}>
            {t('register.alreadyHaveAccount')}{' '}
            <Link
              href={`/login${resolvedTenant?.slug ? `?tenant=${resolvedTenant.slug}` : tenantParam ? `?tenant=${tenantParam}` : ''}`}
              className="underline"
              style={{ color: 'var(--sage-dark, #4a5440)' }}
            >
              {t('register.signIn')}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
