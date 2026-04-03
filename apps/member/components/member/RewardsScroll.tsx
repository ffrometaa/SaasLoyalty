'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RewardCard } from './RewardCard';
import type { RewardItem } from '@/lib/member/types';

interface RewardsScrollProps {
  available: RewardItem[];
  locked: RewardItem[];
}

export function RewardsScroll({ available, locked }: RewardsScrollProps) {
  const [toast, setToast] = useState('');

  function handleLockedTap(reward: RewardItem) {
    const needed = reward.points_cost;
    setToast(`Necesitás ${needed.toLocaleString()} pts para esta recompensa`);
    setTimeout(() => setToast(''), 2500);
  }

  const all = [...available, ...locked];

  if (all.length === 0) {
    return (
      <div className="px-5 py-4 text-center" style={{ color: 'var(--muted)' }}>
        <p className="text-sm">No hay recompensas disponibles todavía.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-1">
        {all.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            available={available.some((r) => r.id === reward.id)}
            onLockedTap={handleLockedTap}
          />
        ))}
      </div>

      {toast && (
        <div
          className="absolute left-5 right-5 rounded-xl px-4 py-3 text-[13px] text-white text-center z-50 animate-slide-up"
          style={{ background: 'var(--text)', bottom: '-48px' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

interface RewardsSectionProps {
  available: RewardItem[];
  locked: RewardItem[];
}

export function RewardsSection({ available, locked }: RewardsSectionProps) {
  return (
    <div className="mt-5">
      {/* Header */}
      <div className="flex justify-between items-center px-5 mb-3.5">
        <span className="font-display text-xl font-normal" style={{ color: 'var(--text)' }}>
          Recompensas para vos
        </span>
        <Link href="/rewards" className="text-xs" style={{ color: 'var(--sage)' }}>
          Ver todas
        </Link>
      </div>

      <RewardsScroll available={available} locked={locked} />
    </div>
  );
}
