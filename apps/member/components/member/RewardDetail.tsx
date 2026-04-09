'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRedemption } from '@/hooks/useRedemption';
import type { RewardItem, MemberProfile } from '@/lib/member/types';

const CATEGORY_EMOJI: Record<string, string> = {
  service: '💆',
  product: '🛍️',
  discount: '✨',
  experience: '🌿',
  gift_card: '🎁',
};

const CATEGORY_BG: Record<string, string> = {
  service: 'var(--clay-light)',
  product: 'var(--sage-light)',
  discount: 'var(--gold-light)',
  experience: 'var(--sage-light)',
  gift_card: 'var(--clay-light)',
};

interface RewardDetailProps {
  reward: RewardItem;
  member: MemberProfile;
}

export function RewardDetail({ reward, member }: RewardDetailProps) {
  const { redeem, loading, error } = useRedemption();
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const t = useTranslations('rewardDetail');

  const canAfford = member.points_balance >= reward.points_cost;
  const afterBalance = member.points_balance - reward.points_cost;
  const emoji = CATEGORY_EMOJI[reward.category] ?? '🎁';
  const heroBg = CATEGORY_BG[reward.category] ?? 'var(--clay-light)';

  async function handleConfirm() {
    const result = await redeem(reward.id, member.id);
    if (result) {
      const params = new URLSearchParams({
        id: result.id,
        code: result.code,
        qr: result.qr_data,
        pts: String(result.points_spent),
        exp: result.expires_at,
        name: result.reward_name,
      });
      router.push(`/redeem/success?${params.toString()}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Hero */}
      <div
        className="px-6 pt-5 pb-6"
        style={{ background: heroBg, borderBottom: '1px solid var(--border)' }}
      >
        <Link
          href="/rewards"
          className="flex items-center gap-1.5 text-[13px] mb-4 bg-transparent border-0 cursor-pointer"
          style={{ color: 'var(--muted)' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('rewards')}
        </Link>

        {/* Image */}
        <div
          className="w-20 h-20 rounded-[20px] flex items-center justify-center mb-3.5"
          style={{ background: 'white', border: '1px solid var(--border)' }}
        >
          {reward.image_url ? (
            <img
              src={reward.image_url}
              alt={reward.name}
              className="w-full h-full object-cover rounded-[20px]"
            />
          ) : (
            <span style={{ fontSize: 40 }}>{emoji}</span>
          )}
        </div>

        <h1
          className="font-display font-normal mb-1.5"
          style={{ fontSize: 26, color: 'var(--text)' }}
        >
          {reward.name}
        </h1>
        {reward.description && (
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {reward.description}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-5">
        {/* Cost breakdown */}
        <div className="mb-4">
          <div className="flex justify-between items-center py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--text)' }}>{t('redemptionCost')}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--brand-primary-dark)' }}>
              {reward.points_cost.toLocaleString()} pts
            </span>
          </div>

          {reward.monetary_value && (
            <div className="flex justify-between items-center py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text)' }}>{t('serviceValue')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                ${reward.monetary_value.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--text)' }}>{t('validFor')}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {t('days', { count: reward.valid_days })}
            </span>
          </div>
        </div>

        {/* Balance card */}
        <div
          className="rounded-[14px] px-4 py-3.5 flex justify-between items-center mb-2"
          style={{ background: 'var(--brand-primary-light)' }}
        >
          <span className="text-[13px]" style={{ color: 'var(--brand-primary-dark)' }}>
            {t('yourPoints')}
          </span>
          <span
            className="font-display text-xl font-medium"
            style={{ color: 'var(--brand-primary-dark)' }}
          >
            {member.points_balance.toLocaleString()}
          </span>
        </div>

        {canAfford && (
          <div
            className="rounded-[14px] px-4 py-3.5 flex justify-between items-center mb-5"
            style={{ background: '#f5f5f5' }}
          >
            <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
              {t('afterRedemption')}
            </span>
            <span className="text-lg font-medium" style={{ color: 'var(--muted)' }}>
              {afterBalance.toLocaleString()}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl px-4 py-3 mb-4 text-sm"
            style={{ background: '#fef2f2', color: '#dc2626' }}
          >
            {error}
          </div>
        )}

        {/* CTA */}
        {!confirming ? (
          <button
            onClick={() => canAfford && setConfirming(true)}
            disabled={!canAfford || loading}
            className="w-full py-4 rounded-[14px] text-[15px] font-medium tracking-wide mb-3 transition-colors"
            style={{
              background: canAfford ? 'var(--brand-primary-dark)' : 'var(--border)',
              color: canAfford ? 'white' : 'var(--muted)',
              cursor: canAfford ? 'pointer' : 'not-allowed',
            }}
          >
            {canAfford ? t('confirmRedeem') : t('notEnoughPoints')}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center mb-3" style={{ color: 'var(--muted)' }}>
              {t('confirmMessage', { pts: reward.points_cost.toLocaleString() })}
            </p>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-4 rounded-[14px] text-[15px] font-medium flex items-center justify-center gap-2 transition-colors"
              style={{
                background: 'var(--brand-primary-dark)',
                color: 'white',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="white"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t('processing')}
                </>
              ) : (
                t('yesRedeem')
              )}
            </button>

            <button
              onClick={() => setConfirming(false)}
              className="w-full py-2.5 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              {t('cancel')}
            </button>
          </div>
        )}

        {!confirming && canAfford && (
          <button
            onClick={() => router.back()}
            className="w-full py-2.5 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            {t('cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
