import Link from 'next/link';
import type { RewardItem } from '@/lib/member/types';

const CATEGORY_COLORS: Record<string, string> = {
  service: 'var(--sage-light)',
  product: 'var(--clay-light)',
  discount: 'var(--gold-light)',
  experience: 'var(--sage-light)',
  gift_card: 'var(--clay-light)',
};

const CATEGORY_EMOJI: Record<string, string> = {
  service: '💆',
  product: '🛍️',
  discount: '✨',
  experience: '🌿',
  gift_card: '🎁',
};

interface RewardCardProps {
  reward: RewardItem;
  available: boolean;
  onLockedTap?: (reward: RewardItem) => void;
}

export function RewardCard({ reward, available, onLockedTap }: RewardCardProps) {
  const bg = CATEGORY_COLORS[reward.category] ?? 'var(--sage-light)';
  const emoji = CATEGORY_EMOJI[reward.category] ?? '🎁';

  const inner = (
    <div
      className="min-w-[160px] flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer card-tap"
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        opacity: available ? 1 : 0.55,
      }}
    >
      {/* Image area */}
      <div
        className="h-[90px] flex items-center justify-center relative"
        style={{ background: bg }}
      >
        {reward.image_url ? (
          <img
            src={reward.image_url}
            alt={reward.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span style={{ fontSize: 36 }}>{emoji}</span>
        )}

        {/* Badge */}
        <div
          className="absolute top-2 right-2 w-[22px] h-[22px] rounded-full flex items-center justify-center"
          style={{
            background: available ? 'var(--sage)' : 'rgba(0,0,0,0.4)',
          }}
        >
          {available ? (
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pt-2.5 pb-3">
        <div className="text-[13px] font-medium leading-tight mb-1" style={{ color: 'var(--text)' }}>
          {reward.name}
        </div>
        <div className="text-xs font-medium" style={{ color: 'var(--sage)' }}>
          {reward.points_cost.toLocaleString()} pts
        </div>
      </div>
    </div>
  );

  if (available) {
    return <Link href={`/rewards/${reward.id}`}>{inner}</Link>;
  }

  return (
    <button
      className="text-left"
      onClick={() => onLockedTap?.(reward)}
      type="button"
    >
      {inner}
    </button>
  );
}
