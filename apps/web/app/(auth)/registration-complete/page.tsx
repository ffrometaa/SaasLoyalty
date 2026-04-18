'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@loyalty-os/lib';

type Status =
  | 'idle'
  | 'sending'
  | 'sent'
  | 'rate-limited'
  | 'error'
  | 'otp-input'
  | 'otp-verifying'
  | 'success'
  | 'otp-error';

function RegistrationCompleteContent() {
  const t = useTranslations('auth.registrationComplete');
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [status, setStatus] = useState<Status>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryAfterMinutes, setRetryAfterMinutes] = useState(0);

  const handleResend = async () => {
    if (!email) return;

    setStatus('sending');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/resend-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'magiclink' }),
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After') ?? '900');
        setRetryAfterMinutes(Math.ceil(retryAfter / 60));
        setStatus('rate-limited');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(t('error'));
        return;
      }

      setStatus('sent');
    } catch {
      setStatus('error');
      setErrorMessage(t('error'));
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || otpCode.length !== 6) return;

    setStatus('otp-verifying');
    setErrorMessage('');

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (error) {
        setStatus('otp-error');
        setErrorMessage(t('otpError'));
        return;
      }

      setStatus('success');
      const dashboardUrl =
        process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://app.loyalbase.dev';
      window.location.href = `${dashboardUrl}/auth/callback?next=/`;
    } catch {
      setStatus('otp-error');
      setErrorMessage(t('otpError'));
    }
  };

  const isResendDisabled = !email || status === 'sending';

  return (
    <div className="auth-container">
      <div className="auth-card max-w-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="auth-title mt-4">{t('title')}</h2>
          <p className="auth-subtitle mt-2">{t('subtitle')}</p>
          {email && (
            <p className="mt-1 text-sm text-indigo-400 font-medium">{email}</p>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900">What&apos;s next?</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>1. Click the link in your email</li>
              <li>2. Complete your business profile</li>
              <li>3. Set up your rewards catalog</li>
              <li>4. Start adding members!</li>
            </ul>
          </div>

          <div className="rounded-lg bg-amber-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-amber-800">
                  <strong>14-day free trial</strong>{' '}
                  {t('trialNote', { trialDays: 14 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status messages */}
        {status === 'sent' && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {t('sent')}
          </div>
        )}

        {status === 'rate-limited' && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {t('rateLimited', { minutes: retryAfterMinutes })}
          </div>
        )}

        {(status === 'error') && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {errorMessage || t('error')}
          </div>
        )}

        {/* Resend section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {!email
              ? t('didntReceive')
              : (
                <>
                  {t('didntReceive')}{' '}
                  <button
                    onClick={handleResend}
                    disabled={isResendDisabled}
                    className="auth-link disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'sending' ? t('sending') : t('resend')}
                  </button>
                </>
              )
            }
          </p>
        </div>

        {/* OTP entry link — shows after successful resend */}
        {status === 'sent' && email && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setStatus('otp-input')}
              className="text-sm text-indigo-600 hover:text-indigo-500 underline"
            >
              {t('useCode')}
            </button>
          </div>
        )}

        {/* OTP input form */}
        {(status === 'otp-input' || status === 'otp-verifying' || status === 'otp-error') && (
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="otp-code" className="auth-label">
                {t('otpLabel')}
              </label>
              <div className="mt-2">
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otpCode}
                  placeholder={t('otpPlaceholder')}
                  onChange={(e) => {
                    const numeric = e.target.value.replace(/\D/g, '');
                    setOtpCode(numeric);
                  }}
                  className="auth-input"
                />
              </div>
            </div>

            {status === 'otp-error' && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {errorMessage || t('otpError')}
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={otpCode.length !== 6 || status === 'otp-verifying'}
              className="auth-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'otp-verifying' ? t('verifying') : t('verify')}
            </button>
          </div>
        )}

        <div className="mt-6 border-t pt-6">
          <Link
            href="/login"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {t('goToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationCompletePage() {
  return (
    <Suspense fallback={null}>
      <RegistrationCompleteContent />
    </Suspense>
  );
}
