'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@loyalty-os/lib';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="auth-title mt-4">Check your email</h2>
            <p className="auth-subtitle mt-2">
              We sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setSuccess(false)}
                className="font-medium underline hover:no-underline"
              >
                try again
              </button>.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/login" className="auth-link">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center">
          <h2 className="auth-title">Reset your password</h2>
          <p className="auth-subtitle">
            Enter your email and we&apos;ll send you reset instructions
          </p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error mt-4">
            {error}
          </div>
        )}

        <form className="auth-form mt-8" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="auth-label">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@business.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Sending...' : 'Send reset instructions'}
          </button>

          <div className="mt-4 text-center">
            <Link href="/login" className="auth-link text-sm">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
