'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DPA_DOCUMENT_ID = '00000000-0000-0000-0000-000000000003';

export default function ConsentPage() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = async () => {
    if (!accepted || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tenant/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: [DPA_DOCUMENT_ID] }),
      });

      if (!res.ok) throw new Error('Failed to record consent');

      router.replace('/');
    } catch {
      setError('Could not save your acceptance. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-brand-purple flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">LoyaltyOS</span>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-purple/10 border border-brand-purple/20 rounded-full mb-4">
              <svg className="h-7 w-7 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Data Processing Agreement</h1>
            <p className="text-sm text-gray-400">
              Before accessing your dashboard, please review and accept our Data Processing Agreement (DPA).
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-5 mb-6 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What this agreement covers</p>
            {[
              'How LoyalBase processes your customers\' personal data on your behalf',
              'Security measures protecting all data (TLS, AES-256, Row Level Security)',
              'Sub-processors used: Supabase, Vercel, Stripe, Resend, OneSignal',
              'Your rights as Data Controller and our obligations as Data Processor',
              'Breach notification within 72 hours and data deletion within 30 days of cancellation',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <svg className="h-4 w-4 text-brand-purple shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">{item}</p>
              </div>
            ))}
          </div>

          {/* Read full DPA link */}
          <p className="text-sm text-gray-400 mb-6 text-center">
            Read the full agreement at{' '}
            <Link
              href="https://loyalbase.dev/dpa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-purple hover:text-purple-400 transition-colors"
            >
              loyalbase.dev/dpa
            </Link>
          </p>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-brand-purple cursor-pointer"
            />
            <span className="text-sm text-gray-300">
              I confirm I have read and accept the{' '}
              <Link
                href="https://loyalbase.dev/dpa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-purple hover:text-purple-400 transition-colors"
              >
                Data Processing Agreement
              </Link>{' '}
              on behalf of my business. I understand this is a legally binding document.
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Accept button */}
          <button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: accepted && !loading ? 'var(--brand-purple)' : undefined, color: 'white' }}
          >
            {loading ? 'Saving…' : 'Accept and Continue'}
          </button>

          <p className="mt-4 text-center text-xs text-gray-600">
            LoyalBase LLC · 7901 4th St N, Ste 300, St. Petersburg, FL 33702
          </p>
        </div>
      </div>
    </div>
  );
}
