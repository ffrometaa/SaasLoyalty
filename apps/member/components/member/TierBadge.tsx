import { useTranslations } from 'next-intl';
import type { MemberTier } from '@/lib/member/types';

interface TierBadgeProps {
  tier: MemberTier;
  nextInfo?: string;
}

const TIER_LABELS: Record<MemberTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

export function TierBadge({ tier, nextInfo }: TierBadgeProps) {
  const t = useTranslations('tier');
  return (
    <div className="flex items-center gap-2 px-4 py-0">
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
        style={{
          background: 'var(--gold-light)',
          borderColor: 'rgba(201,168,76,0.3)',
          color: 'var(--gold)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)' }} />
        {t('member')} {TIER_LABELS[tier]}
      </div>
      {nextInfo && (
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {nextInfo}
        </span>
      )}
    </div>
  );
}
