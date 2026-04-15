'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@loyalty-os/ui';
import { getSupabaseClient } from '@loyalty-os/lib';
import { BUSINESS_TYPES, PLANS, FOUNDING_PARTNER_DISCOUNT } from '@loyalty-os/config';

function RegisterPageInner(): JSX.Element {
  const t = useTranslations('auth.register');
  const ft = useTranslations('founding');
  const searchParams = useSearchParams();
  const isFoundingSource = searchParams.get('source') === 'founding';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'scale'>('starter');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [foundingAvailable, setFoundingAvailable] = useState(false);

  useEffect(() => {
    if (!isFoundingSource) return;
    fetch('/api/founding-spots')
      .then((r) => r.json())
      .then((d) => setFoundingAvailable((d.remaining ?? 0) > 0))
      .catch(() => setFoundingAvailable(false));
  }, [isFoundingSource]);

  const isFoundingPartner = isFoundingSource && foundingAvailable;

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    slug: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptDpa: false,
  });

  const updateField = (field: string, value: string | boolean): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'businessName' && typeof value === 'string') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.businessName.trim()) { setError(t('errBusinessNameRequired')); return false; }
    if (!formData.businessType) { setError(t('errBusinessTypeRequired')); return false; }
    if (!formData.slug.trim()) { setError(t('errSlugRequired')); return false; }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) { setError(t('errSlugInvalid')); return false; }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.email.trim()) { setError(t('errEmailRequired')); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError(t('errEmailInvalid')); return false; }
    if (formData.password.length < 8) { setError(t('errPasswordTooShort')); return false; }
    if (formData.password !== formData.confirmPassword) { setError(t('errPasswordMismatch')); return false; }
    if (!formData.acceptTerms) { setError(t('errTermsRequired')); return false; }
    if (!formData.acceptDpa) { setError(t('errDpaRequired')); return false; }
    return true;
  };

  const handleNext = (): void => {
    setError(null);
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (!validateStep2()) return;
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: 'https://dashboard.loyalbase.dev/auth/callback' },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create user');

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          slug: formData.slug,
          email: formData.email,
          userId: authData.user.id,
          plan: selectedPlan,
          billingPeriod,
          isFoundingPartner,
          acceptedDpa: formData.acceptDpa,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
      // Intentional: data.url is an external Stripe Checkout URL — router.push() does not handle cross-origin navigation
      if (data.url) window.location.href = data.url;
      else throw new Error('No checkout URL received');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const steps = [
    { n: 1, label: t('step1Label') },
    { n: 2, label: t('step2Label') },
    { n: 3, label: t('step3Label') },
  ];

  return (
    <div className="auth-container py-8">
      <div className="auth-card max-w-2xl w-full">
        <div className="text-center">
          <h2 className="auth-title">{t('title')}</h2>
          <p className="auth-subtitle">{t('subtitle')}</p>
        </div>

        {/* Progress stepper */}
        <div className="mt-6">
          <div className="flex items-center">
            {steps.map(({ n, label }, idx) => (
              <div
                key={n}
                className={cn('flex items-center', idx < steps.length - 1 && 'flex-1')}
              >
                <div className={cn('flex items-center', step >= n ? 'text-brand-purple' : 'text-white/30')}>
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    step >= n ? 'bg-brand-purple text-white' : 'bg-white/[0.08] text-white/30'
                  )}>
                    {step > n ? '✓' : n}
                  </div>
                  <span className="ml-2 text-sm font-medium whitespace-nowrap">{label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-4 h-px bg-white/[0.08]">
                    <div className={cn('h-full bg-brand-purple transition-all', step > n ? 'w-full' : 'w-0')} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="auth-alert auth-alert-error mt-4">{error}</div>}

        {/* Step 1 — Business info */}
        {step === 1 && (
          <div className="auth-form mt-8">
            <div>
              <label htmlFor="businessName" className="auth-label">{t('businessName')}</label>
              <div className="mt-2">
                <input id="businessName" type="text" required value={formData.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  className="auth-input" placeholder={t('businessNamePlaceholder')} />
              </div>
            </div>

            <div>
              <label htmlFor="businessType" className="auth-label">{t('businessType')}</label>
              <div className="mt-2">
                <select id="businessType" required value={formData.businessType}
                  onChange={(e) => updateField('businessType', e.target.value)}
                  className="auth-input">
                  <option value="">{t('businessTypeSelect')}</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="slug" className="auth-label">{t('loyaltyUrl')}</label>
              <div className="mt-2">
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                  <span className="inline-flex items-center px-3 text-sm bg-white/5 border-r border-white/10 text-white/40">
                    members.loyalbase.dev/join/
                  </span>
                  <input id="slug" type="text" required value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 py-2.5 px-3 text-white text-sm outline-none bg-white/5"
                    placeholder="serenity-spa" />
                </div>
                <p className="mt-1 text-xs text-white/30">{t('loyaltyUrlHint')}</p>
              </div>
            </div>

            <button type="button" onClick={handleNext} className="auth-button mt-8">{t('continue')}</button>

            <p className="mt-4 text-center text-sm text-white/40">
              {t('alreadyAccount')}{' '}
              <Link href="/login" className="auth-link">{t('signIn')}</Link>
            </p>
          </div>
        )}

        {/* Step 2 — Plan selection */}
        {step === 2 && (
          <div className="mt-8">
            <h3 className="text-base font-semibold text-white mb-4 font-display">{t('choosePlan')}</h3>

            {/* Founding Partner banner */}
            {isFoundingPartner && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm bg-brand-purple/[0.12] border border-brand-purple/[0.35]">
                <p className="font-semibold text-purple-300 mb-0.5">{ft('registerBannerTitle')}</p>
                <p className="text-white/50 text-xs">{ft('registerBannerDesc')}</p>
              </div>
            )}

            {/* Billing period toggle */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all border border-white/10',
                  billingPeriod === 'monthly' ? 'bg-brand-purple text-white' : 'bg-white/5 text-white/50'
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('annual')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all border border-white/10',
                  billingPeriod === 'annual' ? 'bg-brand-purple text-white' : 'bg-white/5 text-white/50'
                )}
              >
                Annual <span className="text-green-500 text-[11px] font-bold">save 17%</span>
              </button>
            </div>

            <div className="grid gap-3">
              {(['starter', 'pro', 'scale'] as const).map((plan) => {
                const details = PLANS[plan];
                const isSelected = selectedPlan === plan;
                return (
                  <button key={plan} type="button" onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      'p-4 rounded-xl text-left transition-all border',
                      isSelected ? 'border-brand-purple bg-brand-purple/10' : 'border-white/[0.08] bg-white/[0.03]'
                    )}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-white font-display">{details.name}</h4>
                        <p className="text-sm mt-0.5 text-white/40">
                          {typeof details.maxMembers === 'number' && details.maxMembers === -1
                            ? t('unlimitedMembers')
                            : t('membersUp', { count: details.maxMembers })}
                        </p>
                      </div>
                      <div className="text-right">
                        {isFoundingPartner && (
                          <p className="text-xs line-through text-white/30">
                            ${billingPeriod === 'annual' ? Math.round(details.price * 10 / 12) : details.price}
                          </p>
                        )}
                        <p className="text-lg font-bold text-white">
                          ${billingPeriod === 'annual'
                            ? Math.round(details.price * (1 - FOUNDING_PARTNER_DISCOUNT) * 10 / 12)
                            : Math.round(details.price * (isFoundingPartner ? (1 - FOUNDING_PARTNER_DISCOUNT) : 1))}
                        </p>
                        <p className="text-xs text-white/40">
                          {billingPeriod === 'annual' ? 'per month, billed annually' : t('perMonth')}
                        </p>
                        {billingPeriod === 'annual' && (
                          <p className="text-xs text-green-500">
                            ${Math.round(details.price * (isFoundingPartner ? (1 - FOUNDING_PARTNER_DISCOUNT) : 1) * 10)}/yr
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex items-center text-brand-purple">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-1.5 text-xs font-medium">{t('selected')}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors border border-white/[0.12] text-white/70 bg-transparent">
                {t('back')}
              </button>
              <button type="button" onClick={() => setStep(3)} className="auth-button flex-1">{t('continue')}</button>
            </div>
          </div>
        )}

        {/* Step 3 — Account credentials */}
        {step === 3 && (
          <form className="auth-form mt-8" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="auth-label">{t('emailLabel')}</label>
              <div className="mt-2">
                <input id="email" type="email" autoComplete="email" required value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="auth-input" placeholder={t('emailPlaceholder')} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="auth-label">{t('passwordLabel')}</label>
              <div className="mt-2">
                <input id="password" type="password" required value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="auth-input" placeholder="••••••••" />
              </div>
              <p className="mt-1 text-xs text-white/30">{t('passwordHint')}</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="auth-label">{t('confirmPassword')}</label>
              <div className="mt-2">
                <input id="confirmPassword" type="password" required value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="auth-input" placeholder="••••••••" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input id="acceptTerms" type="checkbox" required checked={formData.acceptTerms}
                onChange={(e) => updateField('acceptTerms', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-brand-purple cursor-pointer" />
              <label htmlFor="acceptTerms" className="text-sm cursor-pointer text-white/50">
                {t('acceptTerms')}{' '}
                <Link href="/terms" className="auth-link">{t('terms')}</Link>
                {' '}{t('and')}{' '}
                <Link href="/privacy" className="auth-link">{t('privacy')}</Link>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input id="acceptDpa" type="checkbox" required checked={formData.acceptDpa}
                onChange={(e) => updateField('acceptDpa', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-brand-purple cursor-pointer" />
              <label htmlFor="acceptDpa" className="text-sm cursor-pointer text-white/50">
                {t('acceptDpa')}{' '}
                <Link href="/dpa" target="_blank" className="auth-link">{t('dpa')}</Link>
              </label>
            </div>

            {/* Order summary */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <h4 className="font-semibold text-white text-sm">{t('orderSummary')}</h4>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-white/50">{PLANS[selectedPlan].name}</span>
                <span className="font-medium text-white">${PLANS[selectedPlan].price}{t('perMonth')}</span>
              </div>
              <p className="mt-1 text-xs text-white/30">
                {t('trialNote', { price: PLANS[selectedPlan].price })}
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors border border-white/[0.12] text-white/70 bg-transparent">
                {t('back')}
              </button>
              <button type="submit" disabled={loading} className="auth-button flex-1">
                {loading ? t('processing') : t('startTrial')}
              </button>
            </div>

            <p className="text-center text-xs text-white/30">
              <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('stripeNote')}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage(): JSX.Element {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
