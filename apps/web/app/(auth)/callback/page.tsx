'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@loyalty-os/lib';

const ALLOWED_REDIRECT_ORIGINS = ['https://dashboard.loyalbase.dev', 'https://loyalbase.dev'];

function isSafeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_REDIRECT_ORIGINS.some((o) => new URL(o).origin === parsed.origin);
  } catch {
    return false;
  }
}

function AuthCallbackContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async (): Promise<void> => {
      const supabase = getSupabaseClient();

      // Get the code from URL
      const code = searchParams.get('code');
      const rawNext = searchParams.get('next');
      const next = rawNext && isSafeRedirect(rawNext) ? rawNext : 'https://dashboard.loyalbase.dev';

      interface AuthWithCodeExchange {
        exchangeCodeForSession(code: string): Promise<{ error: Error | null }>;
      }
      if (code) {
        const { error } = await (supabase.auth as unknown as AuthWithCodeExchange).exchangeCodeForSession(code);

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        // Redirect to dashboard or specified page
        window.location.href = next;
      } else {
        // No code, try to get session directly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Invalid or expired link');
          setLoading(false);
          return;
        }

        window.location.href = next;
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="auth-title mt-4">Authentication failed</h2>
            <p className="auth-subtitle mt-2">
              {error}
            </p>
          </div>

          <div className="mt-6 text-center">
            <a href="/login" className="auth-link">
              Try again
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <h2 className="auth-title mt-4">Signing you in...</h2>
          <p className="auth-subtitle mt-2">
            Please wait while we verify your account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage(): JSX.Element {
  return (
    <Suspense fallback={
      <div className="auth-container">
        <div className="auth-card">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
            <h2 className="auth-title mt-4">Signing you in...</h2>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
