'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@loyalty-os/lib';
import { BUSINESS_TYPES, PLANS } from '@loyalty-os/config';

export default function RegisterPage() {
  const router = useRouter();
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
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!formData.businessType) {
      setError('Please select a business type');
      return false;
    }
    if (!formData.slug.trim()) {
      setError('Business URL is required');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      setError('URL can only contain lowercase letters, numbers, and hyphens');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.acceptTerms) {
      setError('You must accept the terms of service');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateStep2()) return;
    
    setLoading(true);

    try {
      // Create auth user first
      const supabase = getSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Create checkout session via API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const planDetails = PLANS[selectedPlan as keyof typeof PLANS];

  return (
    <div className="auth-container py-8">
      <div className="auth-card max-w-2xl">
        <div className="text-center">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">
            Start your 14-day free trial
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Business</span>
            </div>
            <div className="flex-1 mx-4 h-0.5 bg-gray-200">
              <div className={`h-full bg-indigo-600 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Plan</span>
            </div>
            <div className="flex-1 mx-4 h-0.5 bg-gray-200">
              <div className={`h-full bg-indigo-600 transition-all ${step >= 3 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Account</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error mt-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="auth-form mt-8">
            <div>
              <label htmlFor="businessName" className="auth-label">
                Business name
              </label>
              <div className="mt-2">
                <input
                  id="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  className="auth-input"
                  placeholder="Serenity Spa"
                />
              </div>
            </div>

            <div>
              <label htmlFor="businessType" className="auth-label">
                Business type
              </label>
              <div className="mt-2">
                <select
                  id="businessType"
                  required
                  value={formData.businessType}
                  onChange={(e) => updateField('businessType', e.target.value)}
                  className="auth-input"
                >
                  <option value="">Select a type</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="slug" className="auth-label">
                Your loyalty URL
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                    loyaltyos.com/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="auth-input rounded-l-none flex-1"
                    placeholder="serenity-spa"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your members will access their rewards at this URL
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="auth-button mt-8"
            >
              Continue
            </button>

            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose your plan</h3>
            
            <div className="grid gap-4">
              {(['starter', 'pro', 'scale'] as const).map((plan) => {
                const details = PLANS[plan];
                const isSelected = selectedPlan === plan;
                
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{details.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Up to {details.maxMembers === -1 ? 'unlimited' : details.maxMembers} members
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${details.price}</p>
                        <p className="text-sm text-gray-500">/month</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center text-indigo-600">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-sm font-medium">Selected</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="auth-button flex-1"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form className="auth-form mt-8" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="auth-label">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="auth-input"
                  placeholder="you@business.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                At least 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="auth-label">
                Confirm password
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="acceptTerms"
                type="checkbox"
                required
                checked={formData.acceptTerms}
                onChange={(e) => updateField('acceptTerms', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="auth-link">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="auth-link">Privacy Policy</Link>
              </label>
            </div>

            {/* Order summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Order Summary</h4>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-600">{PLANS[selectedPlan as keyof typeof PLANS].name} Plan</span>
                <span className="font-medium">${PLANS[selectedPlan as keyof typeof PLANS].price}/mo</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">14-day free trial, then ${PLANS[selectedPlan as keyof typeof PLANS].price}/month</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="auth-button flex-1"
              >
                {loading ? 'Processing...' : 'Start free trial'}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              <svg className="inline h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
