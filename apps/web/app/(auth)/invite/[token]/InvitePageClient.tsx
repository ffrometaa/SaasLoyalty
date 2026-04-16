'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@loyalty-os/lib';

interface InviteInfo {
  id: string;
  email: string;
  role: string;
  businessName: string;
}

interface Props {
  token: string;
  initialInvite: InviteInfo | null;
  initialError: string | null;
}

export function InvitePageClient({ token, initialInvite, initialError }: Props): JSX.Element {
  const [invite] = useState<InviteInfo | null>(initialInvite);
  const [inviteError] = useState<string | null>(initialError);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth form state
  const [email, setEmail] = useState(initialInvite?.email ?? '');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Accept state
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // Session check is browser-side auth state — cannot be replaced by server-side fetch
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data: { user: u }, error: userError }): void => {
      if (userError) { setLoading(false); return; }
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handleAuth = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const supabase = getSupabaseClient();

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }

      const { data: { user: newUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setUser(newUser);

      // Auto-accept after successful auth
      if (newUser) {
        const res = await fetch('/api/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setAccepted(true);
          // Intentional: redirectUrl points to dashboard.loyalbase.dev — router.push() does not handle cross-origin navigation
          setTimeout((): void => { window.location.href = data.redirectUrl; }, 1500);
          return;
        }
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAccept = async (): Promise<void> => {
    setAccepting(true);
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAccepted(true);
      // Intentional: redirectUrl points to dashboard.loyalbase.dev — router.push() does not handle cross-origin navigation
      setTimeout((): void => { window.location.href = data.redirectUrl; }, 1500);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent mx-auto" />
        </div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <div className="h-12 w-12 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="auth-title">Invalid Invitation</h2>
          <p className="text-gray-400 text-sm mt-2">{inviteError}</p>
          <Link href="/login" className="auth-link block mt-6 text-sm">Go to login →</Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="auth-title">You&apos;re in!</h2>
          <p className="text-gray-400 text-sm mt-2">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-brand-purple/20 flex items-center justify-center mx-auto mb-4">
            <svg className="h-7 w-7 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="auth-title">You&apos;ve been invited</h2>
          <p className="text-gray-400 text-sm mt-2">
            Join <span className="text-white font-semibold">{invite?.businessName}</span> as a team member on LoyaltyOS
          </p>
        </div>

        {authError && (
          <div className="auth-alert auth-alert-error mb-4">{authError}</div>
        )}

        {user ? (
          // Logged in — show accept button
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">
              Logged in as <span className="text-white">{user.email}</span>
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="auth-button"
            >
              {accepting ? 'Accepting…' : `Accept & Join ${invite?.businessName}`}
            </button>
            <p className="text-gray-500 text-xs mt-4">
              Not you?{' '}
              <button
                onClick={async (): Promise<void> => {
                  await getSupabaseClient().auth.signOut();
                  setUser(null);
                }}
                className="text-purple-300 hover:underline"
              >
                Sign out
              </button>
            </p>
          </div>
        ) : (
          // Not logged in — show auth form
          <>
            <div className="flex gap-2 mb-6">
              {(['login', 'register'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={(): void => setAuthMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    authMode === mode
                      ? 'bg-brand-purple text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {mode === 'login' ? 'Log in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              <div>
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e): void => setEmail(e.target.value)}
                  className="auth-input mt-2"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e): void => setPassword(e.target.value)}
                  className="auth-input mt-2"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={authLoading} className="auth-button">
                {authLoading
                  ? (authMode === 'login' ? 'Signing in…' : 'Creating account…')
                  : (authMode === 'login' ? 'Sign in & Accept' : 'Create account & Accept')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
