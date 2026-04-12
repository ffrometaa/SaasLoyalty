'use client';

import { useState } from 'react';

interface Props {
  googleReviewUrl: string;
  bonusPoints: number;
}

export function GoogleReviewCard({ googleReviewUrl, bonusPoints }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handleClaim() {
    if (state !== 'idle') return;
    setState('loading');
    window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
    const res = await fetch('/api/member/google-review-claim', { method: 'POST' });
    setState(res.ok ? 'done' : 'idle');
  }

  if (state === 'done') {
    return (
      <div
        className="mx-5 mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
        style={{ background: '#16a34a20', border: '1px solid #16a34a40' }}
      >
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-sm font-bold text-green-400">+{bonusPoints} pts credited!</p>
          <p className="text-xs text-white/50">Thanks for your review.</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClaim}
      disabled={state === 'loading'}
      className="mx-5 mt-4 w-[calc(100%-2.5rem)] text-left rounded-2xl overflow-hidden"
      style={{ background: 'white', border: '1.5px solid #facc15' }}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">⭐</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">Leave a Google Review</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Earn <span className="font-semibold text-amber-600">+{bonusPoints} pts</span> for sharing your experience
          </p>
        </div>
        <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
