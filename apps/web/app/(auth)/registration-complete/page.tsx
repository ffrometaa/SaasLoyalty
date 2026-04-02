import Link from 'next/link';

export default function RegistrationCompletePage() {
  return (
    <div className="auth-container">
      <div className="auth-card max-w-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="auth-title mt-4">Check your email!</h2>
          <p className="auth-subtitle mt-2">
            We&apos;ve sent a confirmation email to complete your registration.
          </p>
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
                  <strong>14-day free trial</strong> starts when you first access your dashboard after confirming your email.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn&apos;t receive the email?{' '}
            <button className="auth-link">
              Resend confirmation
            </button>
          </p>
        </div>

        <div className="mt-6 border-t pt-6">
          <Link
            href="/login"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
