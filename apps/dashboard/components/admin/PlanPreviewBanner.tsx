'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function PlanPreviewBanner({ plan = '' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const planLabels = Object.fromEntries(Object.entries({
    starter: 'Starter',
    pro: 'Pro',
    scale: 'Scale',
    enterprise: 'Enterprise',
  }));

  function handleExit() {
    startTransition(async () => {
      await fetch('/admin/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: null }),
      });
      router.refresh();
    });
  }

  return (
    <div className="sticky top-0 z-50 bg-amber-400 border-b border-amber-500 px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-900 shrink-0">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span className="text-sm font-semibold text-amber-900">
          Plan Preview Mode — viewing as{' '}
          <span className="uppercase tracking-wide">{planLabels[plan] ?? plan}</span> plan
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={isPending}
        className="text-xs font-semibold text-amber-900 bg-amber-900/15 hover:bg-amber-900/25 px-3 py-1.5 rounded-md transition-colors disabled:opacity-60"
      >
        {isPending ? 'Exiting…' : '✕ Exit Preview'}
      </button>
    </div>
  );
}
