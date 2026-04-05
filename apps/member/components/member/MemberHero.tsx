import { PointsCard } from './PointsCard';
import { getTierProgress } from '@/lib/member/types';
import type { MemberProfile } from '@/lib/member/types';

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

interface MemberHeroProps {
  member: MemberProfile;
}

export function MemberHero({ member }: MemberHeroProps) {
  const { percent, pointsToNext, nextTier } = getTierProgress(
    member.points_lifetime,
    member.tier
  );

  const appName = member.tenant.brand_app_name ?? member.tenant.business_name;

  return (
    <div
      className="relative px-6 pt-7 pb-10 overflow-hidden"
      style={{ background: 'var(--brand-primary-dark)' }}
    >
      {/* Decorative circles */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 220,
          height: 220,
          background: 'rgba(255,255,255,0.04)',
          top: -60,
          right: -60,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 140,
          height: 140,
          background: 'rgba(255,255,255,0.03)',
          bottom: -20,
          left: 30,
        }}
      />

      {/* Top bar */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <span
          className="font-display text-xl font-normal tracking-wide"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          {appName}
        </span>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          aria-label="Notificaciones"
        >
          <svg
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="1.8"
          >
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>

      {/* Greeting */}
      <div className="relative z-10 mb-5">
        <p className="text-[13px] font-light mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Bienvenida de vuelta
        </p>
        <h1
          className="font-display font-light text-white"
          style={{ fontSize: 28 }}
        >
          {member.name}
        </h1>
      </div>

      {/* Points card */}
      <div className="relative z-10">
        <PointsCard
          balance={member.points_balance}
          expiryDays={member.tenant.points_expiry_days ?? 365}
          tierPercent={percent}
          tierLabel={TIER_LABELS[member.tier]}
          tierNext={nextTier ? TIER_LABELS[nextTier] : null}
          pointsToNext={pointsToNext}
        />
      </div>
    </div>
  );
}
