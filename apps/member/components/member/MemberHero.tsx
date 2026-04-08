import { PointsCard } from './PointsCard';
import { NotificationBell } from './NotificationBell';
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
          top: -80,
          right: -80,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 140,
          height: 140,
          background: 'rgba(255,255,255,0.03)',
          bottom: -50,
          left: 10,
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
        <NotificationBell />
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
