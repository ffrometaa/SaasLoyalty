'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FeatureGate } from './FeatureGate';
import type { Plan } from '@/lib/plans/features';

type MultiplierCondition =
  | 'always'
  | 'tier_bronze'
  | 'tier_silver'
  | 'tier_gold'
  | 'tier_platinum'
  | 'new_member'
  | 'at_risk';

interface Multiplier {
  id: string;
  name: string;
  multiplier: number;
  condition: MultiplierCondition;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface MultiplierScheduleProps {
  plan: Plan;
  multipliers: Multiplier[];
  onDeactivate?: (id: string) => Promise<void>;
}

const CONDITION_LABELS = Object.fromEntries(Object.entries({
  always:        'All members',
  tier_bronze:   'Bronze tier',
  tier_silver:   'Silver tier',
  tier_gold:     'Gold tier',
  tier_platinum: 'Platinum tier',
  new_member:    'New members (≤30d)',
  at_risk:       'At-risk members',
}));

function formatDateShort(iso = '') {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isCurrentlyActive(m: Multiplier) {
  const now = Date.now();
  return m.is_active && new Date(m.starts_at).getTime() <= now && new Date(m.ends_at).getTime() >= now;
}

export function MultiplierSchedule({ plan, multipliers, onDeactivate }: MultiplierScheduleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deactivating, setDeactivating] = useState('');

  function handleDeactivate(id = '') {
    if (!onDeactivate) return;
    setDeactivating(id);
    startTransition(async () => {
      await onDeactivate(id);
      setDeactivating('');
      router.refresh();
    });
  }

  const active = multipliers.filter(isCurrentlyActive);
  const upcoming = multipliers.filter(m => m.is_active && new Date(m.starts_at).getTime() > Date.now());
  const past = multipliers.filter(m => !isCurrentlyActive(m) && !upcoming.includes(m));

  function MultiplierRow({ m = { id: '', name: '', multiplier: 1, condition: 'always' as MultiplierCondition, starts_at: '', ends_at: '', is_active: false }, isActive = false }) {
    return (
      <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border ${
        isActive
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-white/[0.02] border-white/[0.05]'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-white">{m.name}</span>
            <span className="text-[10px] font-bold text-[#a78bfa] bg-[#7c3aed]/15 px-1.5 py-0.5 rounded">
              {m.multiplier}x
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            {CONDITION_LABELS[m.condition] ?? m.condition} · {formatDateShort(m.starts_at)} → {formatDateShort(m.ends_at)}
          </p>
        </div>
        {isActive && onDeactivate && (
          <button
            onClick={() => handleDeactivate(m.id)}
            disabled={isPending && deactivating === m.id}
            className="text-[10px] text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            Stop
          </button>
        )}
      </div>
    );
  }

  return (
    <FeatureGate plan={plan} feature="gamification_advanced">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Point Multipliers</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {active.length} active · {upcoming.length} upcoming
          </p>
        </div>

        {multipliers.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No multipliers configured. Create one to boost member engagement.
          </p>
        ) : (
          <div className="space-y-4">
            {active.length > 0 && (
              <div>
                <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wide mb-2">
                  Active now
                </p>
                <div className="space-y-1.5">
                  {active.map(m => <MultiplierRow key={m.id} m={m} isActive />)}
                </div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-2">
                  Upcoming
                </p>
                <div className="space-y-1.5">
                  {upcoming.map(m => <MultiplierRow key={m.id} m={m} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-2">
                  Past
                </p>
                <div className="space-y-1.5 opacity-50">
                  {past.slice(0, 3).map(m => <MultiplierRow key={m.id} m={m} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
