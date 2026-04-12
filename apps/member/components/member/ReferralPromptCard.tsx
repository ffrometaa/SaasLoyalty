'use client';

import Link from 'next/link';

interface Props {
  referralCode: string;
  pointsForReferree: number;
}

export function ReferralPromptCard({ referralCode, pointsForReferree }: Props) {
  return (
    <Link
      href="/profile/referrals"
      className="mx-5 mt-4 flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: 'white', border: '1.5px solid var(--brand-primary)' }}
    >
      <span className="text-2xl">🎁</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>
          Invite friends, earn points
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Your code: <span className="font-mono font-semibold tracking-wider">{referralCode}</span>
          {' · '}friend gets <span className="font-semibold">{pointsForReferree} pts</span>
        </p>
      </div>
      <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
