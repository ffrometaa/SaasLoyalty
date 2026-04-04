'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

const PLANS = [
  { id: 'starter', label: 'Starter' },
  { id: 'pro', label: 'Pro' },
  { id: 'scale', label: 'Scale' },
  { id: 'enterprise', label: 'Enterprise' },
];

export function PlanPreviewSwitcher({ activePlan = '' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function selectPlan(plan = '') {
    startTransition(async () => {
      await fetch('/admin/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      router.refresh();
    });
  }

  function exitPreview() {
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
    <div className="fixed bottom-6 right-6 z-50 sm:bottom-6 sm:right-6 sm:w-auto w-full sm:left-auto left-0">
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 mx-4 sm:mx-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 px-1">
          Preview as plan:
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PLANS.map(p => (
            <button
              key={p.id}
              onClick={() => selectPlan(p.id)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 ${
                activePlan === p.id
                  ? 'bg-[#7c3aed] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
          {activePlan && (
            <button
              onClick={exitPreview}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-60 ml-1"
            >
              ✕ Exit
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2 px-1">
          {activePlan ? `Viewing as ${activePlan}` : 'No preview active'}
        </p>
      </div>
    </div>
  );
}
