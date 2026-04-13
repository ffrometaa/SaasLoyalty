import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { getServerUser } from '@/lib/supabase';
import { getMemberWithTenant, getRewardsForTenant } from '@/lib/member/queries';
import { BottomNav } from '@/components/member/BottomNav';
import { BrandTheme } from '@/components/member/BrandTheme';

const CATEGORY_EMOJI: Record<string, string> = {
  service: '💆',
  product: '🛍️',
  discount: '✨',
  experience: '🌿',
  gift_card: '🎁',
};

export default async function RewardsPage() {
  const t = await getTranslations('rewards');
  const user = await getServerUser();
  if (!user) redirect('/login');

  const member = await getMemberWithTenant(user.id);
  if (!member) redirect('/login');

  const { available, locked } = await getRewardsForTenant(
    member.tenant_id,
    member.points_balance
  );

  const redeemableCount = available.length;

  return (
    <>
      <BrandTheme
        primary={member.tenant.brand_color_primary}
        secondary={member.tenant.brand_color_secondary}
      />

      <main className="pb-safe min-h-screen" style={{ background: 'var(--cream)' }}>
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
          style={{ background: 'white', borderBottom: '1px solid var(--border)' }}
        >
          <Link href="/" className="p-0 border-0 bg-transparent cursor-pointer">
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--sage-dark)"
              strokeWidth="1.8"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <h1 className="font-display text-xl font-normal" style={{ color: 'var(--text)' }}>
              {t('pageTitle')}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {t('pointsAvailable', { points: member.points_balance.toLocaleString() })}
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* Info banner */}
          {redeemableCount > 0 && (
            <div
              className="rounded-[14px] px-4 py-3.5 mb-5 flex items-start gap-3"
              style={{ background: 'var(--brand-primary-light)' }}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="var(--sage-dark)"
                strokeWidth="1.8"
                className="flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--sage-dark)' }}>
                {t.rich('canRedeem', {
                  count: redeemableCount,
                  s: redeemableCount > 1 ? 's' : '',
                  strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
                })}
                {' '}{t('redeemNote')}
              </p>
            </div>
          )}

          {/* Available */}
          {available.length > 0 && (
            <section className="mb-6">
              <p
                className="text-xs tracking-[1px] uppercase mb-3"
                style={{ color: 'var(--muted)' }}
              >
                {t('availableForYou')}
              </p>
              <div className="flex flex-col gap-2.5">
                {available.map((reward) => (
                  <Link
                    key={reward.id}
                    href={`/rewards/${reward.id}`}
                    className="flex items-center gap-3.5 rounded-[14px] px-3.5 py-3.5 card-tap"
                    style={{
                      background: 'white',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span className="text-3xl w-12 text-center flex-shrink-0">
                      {reward.image_url ? (
                        <Image
                          src={reward.image_url}
                          alt={reward.name}
                          width={48}
                          height={48}
                          className="rounded-xl object-cover"
                        />
                      ) : (
                        CATEGORY_EMOJI[reward.category] ?? '🎁'
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {reward.name}
                      </p>
                      {reward.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                          {reward.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--brand-primary-dark)' }}>
                        {reward.points_cost.toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>pts</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Locked */}
          {locked.length > 0 && (
            <section className="mb-8">
              <p
                className="text-xs tracking-[1px] uppercase mb-3"
                style={{ color: 'var(--muted)' }}
              >
                {t('locked')}
              </p>
              <div className="flex flex-col gap-2.5" style={{ opacity: 0.55 }}>
                {locked.map((reward) => {
                  const lacking = reward.points_cost - member.points_balance;
                  return (
                    <div
                      key={reward.id}
                      className="flex items-center gap-3.5 rounded-[14px] px-3.5 py-3.5"
                      style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span className="text-3xl w-12 text-center flex-shrink-0">
                        {CATEGORY_EMOJI[reward.category] ?? '🎁'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {reward.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                          {t('needMore', { points: lacking.toLocaleString() })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {reward.points_cost.toLocaleString()}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {available.length === 0 && locked.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🎁</p>
              <p className="font-display text-xl mb-2" style={{ color: 'var(--text)' }}>
                {t('empty')}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('emptyDesc')}
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
