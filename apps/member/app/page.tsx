import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase';
import { getMemberWithTenant, getRewardsForTenant, getMemberTransactions } from '@/lib/member/queries';
import { MemberHero } from '@/components/member/MemberHero';
import { TierBadge } from '@/components/member/TierBadge';
import { QuickActions } from '@/components/member/QuickActions';
import { RewardsSection } from '@/components/member/RewardsScroll';
import { TransactionHistory } from '@/components/member/TransactionHistory';
import { BottomNav } from '@/components/member/BottomNav';
import { BrandTheme } from '@/components/member/BrandTheme';
import { getTierProgress, TIER_NEXT } from '@/lib/member/types';

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

export default async function HomePage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const member = await getMemberWithTenant(user.id);
  if (!member) redirect('/login');

  const [{ available, locked }, transactions] = await Promise.all([
    getRewardsForTenant(member.tenant_id, member.points_balance, 6),
    getMemberTransactions(member.id, 5),
  ]);

  const { pointsToNext, nextTier } = getTierProgress(member.points_lifetime, member.tier);

  const nextTierLabel = nextTier ? TIER_LABELS[nextTier] : null;
  const nextInfo = nextTier
    ? `2x puntos en ${nextTierLabel}`
    : 'Nivel máximo alcanzado';

  return (
    <>
      <BrandTheme
        primary={member.tenant.brand_color_primary}
        secondary={member.tenant.brand_color_secondary}
      />

      <main className="pb-safe" style={{ background: 'var(--cream)' }}>
        {/* Hero with points card */}
        <MemberHero member={member} />

        {/* Tier row */}
        <div className="pt-4 pb-1">
          <TierBadge tier={member.tier} nextInfo={nextInfo} />
        </div>

        {/* Quick actions */}
        <QuickActions />

        {/* Rewards horizontal scroll */}
        <div className="mt-6">
          <RewardsSection available={available} locked={locked} />
        </div>

        {/* Transaction history */}
        <div className="mt-6 px-5 pb-8">
          <div className="flex justify-between items-center mb-3.5">
            <span className="font-display text-xl font-normal" style={{ color: 'var(--text)' }}>
              Últimas actividades
            </span>
          </div>
          <TransactionHistory transactions={transactions} />
        </div>
      </main>

      <BottomNav />
    </>
  );
}
