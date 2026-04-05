import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getServerUser } from '@/lib/supabase';
import { getMemberWithTenant, getRewardsForTenant, getMemberTransactions } from '@/lib/member/queries';
import { MemberHero } from '@/components/member/MemberHero';
import { TierBadge } from '@/components/member/TierBadge';
import { QuickActions } from '@/components/member/QuickActions';
import { RewardsSection } from '@/components/member/RewardsScroll';
import { TransactionHistory } from '@/components/member/TransactionHistory';
import { BottomNav } from '@/components/member/BottomNav';
import { BrandTheme } from '@/components/member/BrandTheme';
import { OneSignalInit } from '@/components/member/OneSignalInit';
import { getTierProgress, TIER_NEXT } from '@/lib/member/types';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import Link from 'next/link';

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

interface ActiveMultiplier {
  id: string;
  name: string;
  multiplier: number;
  ends_at: string;
}

interface DynamicChallenge {
  id: string;
  name: string;
  type: string;
  goal_value: number;
  bonus_points: number;
  current_value: number;
  expires_at: string;
}

async function getActiveMultiplier(tenantId: string): Promise<ActiveMultiplier | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('point_multipliers')
      .select('id, name, multiplier, ends_at')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('multiplier', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data as ActiveMultiplier | null;
  } catch {
    return null;
  }
}

async function getTopDynamicChallenge(tenantId: string, memberId: string): Promise<DynamicChallenge | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('dynamic_challenges')
      .select('id, name, type, goal_value, bonus_points, current_value, expires_at')
      .eq('tenant_id', tenantId)
      .eq('member_id', memberId)
      .eq('is_dismissed', false)
      .is('completed_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data as DynamicChallenge | null;
  } catch {
    return null;
  }
}

const TYPE_ICONS: Record<string, string> = {
  visit_count: '🎯',
  points_earned: '⭐',
  referral: '⚡',
  spend_amount: '🏆',
  streak: '🔥',
};

export default async function HomePage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const member = await getMemberWithTenant(user.id);
  if (!member) {
    // Authenticated but no member record — redirect to join/register flow
    const cookieStore = await cookies();
    const tenantSlug = cookieStore.get('loyalty_tenant')?.value;
    redirect(tenantSlug ? `/join/${tenantSlug}` : '/register');
  }

  const [{ available, locked }, transactions, activeMultiplier, dynamicChallenge] = await Promise.all([
    getRewardsForTenant(member.tenant_id, member.points_balance, 6),
    getMemberTransactions(member.id, 5),
    getActiveMultiplier(member.tenant_id),
    getTopDynamicChallenge(member.tenant_id, member.id),
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
      <OneSignalInit memberId={member.id} />

      <main className="pb-safe" style={{ background: 'var(--cream)' }}>
        {/* Hero with points card */}
        <MemberHero member={member} />

        {/* Tier row */}
        <div className="pt-4 pb-1">
          <TierBadge tier={member.tier} nextInfo={nextInfo} />
        </div>

        {/* ── ACTIVE MULTIPLIER BANNER ── */}
        {activeMultiplier && (
          <div
            className="mx-5 mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
            style={{ background: 'var(--brand-primary)', color: 'white' }}
          >
            <span className="text-2xl">⚡</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">{activeMultiplier.multiplier}x Puntos Activos</p>
              <p className="text-xs text-white/70 mt-0.5 truncate">
                {activeMultiplier.name} · hasta {new Date(activeMultiplier.ends_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* ── PERSONALIZED DYNAMIC CHALLENGE CARD ── */}
        {dynamicChallenge && (
          <div className="mx-5 mt-4">
            <Link
              href="/challenges"
              className="block rounded-2xl p-4"
              style={{ background: 'white', border: '2px solid var(--brand-primary)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{TYPE_ICONS[dynamicChallenge.type] ?? '🎯'}</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ background: 'var(--brand-primary)' }}
                >
                  Solo para ti
                </span>
              </div>
              <p className="text-sm font-semibold truncate mb-1" style={{ color: 'var(--text)' }}>
                {dynamicChallenge.name}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((dynamicChallenge.current_value / dynamicChallenge.goal_value) * 100))}%`,
                      background: 'var(--brand-primary)',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--brand-primary-dark)' }}>
                  +{dynamicChallenge.bonus_points} pts
                </span>
              </div>
            </Link>
          </div>
        )}

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
