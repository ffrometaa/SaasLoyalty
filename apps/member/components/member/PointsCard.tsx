'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';

interface PointsCardProps {
  balance: number;
  expiryDays: number;
  tierPercent: number;
  tierLabel: string;
  tierNext: string | null;
  pointsToNext: number;
  i18n: {
    pointsAvailable: string;
    validUntil: string;
    tierLevel: string;
    ptsToNext: string;
    maxTier: string;
  };
}

export function PointsCard({
  balance,
  expiryDays,
  tierPercent,
  tierLabel,
  tierNext,
  pointsToNext,
  i18n,
}: PointsCardProps) {
  const numRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  // Count-up animation
  useEffect(() => {
    if (!numRef.current) return;
    const target = balance;
    const duration = 800;
    const start = Date.now();

    function step() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      if (numRef.current) {
        numRef.current.textContent = current.toLocaleString(locale);
      }

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [balance, locale]);

  const expiryDate = new Date(Date.now() + expiryDays * 86400000);
  const expiryMonth = new Intl.DateTimeFormat(locale, { month: 'long' }).format(expiryDate);
  const expiryYear = expiryDate.getFullYear();

  return (
    <div
      className="rounded-[20px] p-5 relative z-10"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <div
        className="text-xs font-medium mb-2 tracking-[1.5px] uppercase"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        {i18n.pointsAvailable}
      </div>

      <div
        ref={numRef}
        className="font-display font-light text-white leading-none mb-1"
        style={{ fontSize: '52px' }}
      >
        {balance.toLocaleString(locale)}
      </div>

      <div className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {i18n.validUntil.replace('{month}', expiryMonth).replace('{year}', String(expiryYear))}
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full mb-2"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <div
          className="h-1 rounded-full animate-bar-fill"
          style={{
            width: `${tierPercent}%`,
            background: 'var(--brand-secondary)',
          }}
        />
      </div>

      <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
        <span>{i18n.tierLevel.replace('{tier}', tierLabel)}</span>
        {tierNext ? (
          <span>{i18n.ptsToNext.replace('{points}', pointsToNext.toLocaleString(locale)).replace('{tier}', tierNext)}</span>
        ) : (
          <span>{i18n.maxTier} ✦</span>
        )}
      </div>
    </div>
  );
}
