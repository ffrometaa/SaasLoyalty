'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@loyalty-os/lib';
import { BUSINESS_TYPES, PLANS } from '@loyalty-os/config';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');

  // Form data
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    slug: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from business name
    if (field === 'businessName') {
      const slug = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const validateStep1 = () => {
    if (!formData.businessName.trim()) { setError('Business name is required'); return false; }
    if (!formData.businessType) { setError('Please select a business type'); return false; }
    if (!formData.slug.trim()) { setError('Business URL is required'); return false; }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) { setError('URL can only contain lowercase letters, numbers, and hyphens'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email.trim()) { setError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Please enter a valid email'); return false; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    if (!formData.acceptTerms) { setError('You must accept the terms of service'); return false; }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateStep2()) return;
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: `${window.location.origin}/callback` },
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
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
      if (data.url) window.location.href = data.url;
      else throw new Error('No checkout URL received');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const planDetails = PLANS[selectedPlan as keyof typeof PLANS];

  return (
    <div className="auth-container py-8">
      <div className="auth-card max-w-2xl" style={{ maxWidth: '42rem' }}>
        <div className="text-center">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Start your 14-day free trial</p>
        </div>

        {/* Progress indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            {[
              { n: 1, label: 'Business' },
              { n: 2, label: 'Plan' },
              { n: 3, label: 'Account' },
            ].map(({ n, label }, idx) => (
              <div key={n} className="flex items-center flex-1">
                <div className={`flex items-center ${step >= n ? 'text-brand-purple' : 'text-white/30'}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${step >= n ? 'bg-brand-purple text-white' : 'text-white/30'}`}
                    style={step < n ? { backgroundColor: 'rgba(255,255,255,0.08)' } : undefined}>
                    {step > n ? '✓' : n}
                  </div>
                  <span className="ml-2 text-sm font-medium">{label}</span>
                </div>
                {idx < 2 && (
                  <div className="flex-1 mx-4 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full bg-brand-purple transition-all" style={{ width: step > n ? '100%' : '0%' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error mt-4">{error}</div>
        )}

        {/* Step 1 — Business info */}
        {step === 1 && (
          <div className="auth-form mt-8">
            <div>
              <label htmlFor="businessName" className="auth-label">Business name</label>
              <div className="mt-2">
                <input id="businessName" type="text" required value={formData.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  className="auth-input" placeholder="Serenity Spa" />
              </div>
            </div>

            <div>
              <label htmlFor="businessType" className="auth-label">Business type</label>
              <div className="mt-2">
                <select id="businessType" required value={formData.businessType}
                  onChange={(e) => updateField('businessType', e.target.value)}
                  className="auth-input">
                  <option value="">Select a type</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="slug" className="auth-label">Your loyalty URL</label>
              <div className="mt-2">
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="inline-flex items-center px-3 text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                    loyaltyos.com/
                  </span>
                  <input id="slug" type="text" required value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 py-2.5 px-3 text-white text-sm bg-transparent outline-none focus:ring-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    placeholder="serenity-spa" />
                </div>
                <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Your members will access their rewards at this URL
                </p>
              </div>
            </div>

            <button type="button" onClick={handleNext} className="auth-button mt-8">
              Continue
            </button>

            <p className="mt-4 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Already have an account?{' '}
              <Link href="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        )}

        {/* Step 2 — Plan selection */}
        {step === 2 && (
          <div className="mt-8">
            <h3 className="text-base font-semibold text-white mb-4">Choose your plan</h3>

            <div className="grid gap-3">
              {(['starter', 'pro', 'scale'] as const).map((plan) => {
                const details = PLANS[plan];
                const isSelected = selectedPlan === plan;
                return (
                  <button key={plan} type="button" onClick={() => setSelectedPlan(plan)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      border: isSelected ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: isSelected ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                    }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-white font-display">{details.name}</h4>
                        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Up to {details.maxMembers === -1 ? 'unlimited' : details.maxMembers} members
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">${details.price}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>/month</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex items-center text-brand-purple">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-1.5 text-xs font-medium">Selected</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent' }}>
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="auth-button flex-1">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Account credentials */}
        {step === 3 && (
          <form className="auth-form mt-8" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="auth-label">Email address</label>
              <div className="mt-2">
                <input id="email" type="email" autoComplete="email" required value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="auth-input" placeholder="you@business.com" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="auth-label">Password</label>
              <div className="mt-2">
                <input id="password" type="password" required value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="auth-input" placeholder="••••••••" />
              </div>
              <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>At least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="auth-label">Confirm password</label>
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
              <label htmlFor="acceptTerms" className="text-sm cursor-pointer" style={{ color: 'rgba(255,255,255,0.5)' }}>
                I agree to the{' '}
                <Link href="/terms" className="auth-link">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="auth-link">Privacy Policy</Link>
              </label>
            </div>

            {/* Order summary */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 className="font-semibold text-white text-sm">Order Summary</h4>
              <div className="mt-2 flex justify-between text-sm">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{PLANS[selectedPlan as keyof typeof PLANS].name} Plan</span>
                <span className="font-medium text-white">${PLANS[selectedPlan as keyof typeof PLANS].price}/mo</span>
              </div>
              <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                14-day free trial, then ${PLANS[selectedPlan as keyof typeof PLANS].price}/month
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent' }}>
                Back
              </button>
              <button type="submit" disabled={loading} className="auth-button flex-1">
                {loading ? 'Processing...' : 'Start free trial'}
              </button>
            </div>

            <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <svg className="inline h-4 w-4 mr-1" style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secured by Stripe. No card charged during trial.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
