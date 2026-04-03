'use client';

import { useEffect, useRef } from 'react';

interface PointsCardProps {
  balance: number;
  expiryDays: number;
  tierPercent: number;
  tierLabel: string;
  tierNext: string | null;
  pointsToNext: number;
}

export function PointsCard({
  balance,
  expiryDays,
  tierPercent,
  tierLabel,
  tierNext,
  pointsToNext,
}: PointsCardProps) {
  const numRef = useRef<HTMLDivElement>(null);

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
        numRef.current.textContent = current.toLocaleString('es-AR');
      }

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [balance]);

  const expiryYear = new Date().getFullYear() + Math.floor(expiryDays / 365);
  const expiryMonth = new Intl.DateTimeFormat('es', { month: 'long' }).format(
    new Date(Date.now() + expiryDays * 86400000)
  );

  return (
    <div
      className="rounded-[20px] p-5 relative z-10"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <div
        className="text-[11px] font-medium mb-2 tracking-[1.5px] uppercase"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        Puntos disponibles
      </div>

      <div
        ref={numRef}
        className="font-display font-light text-white leading-none mb-1"
        style={{ fontSize: '52px' }}
      >
        {balance.toLocaleString('es-AR')}
      </div>

      <div className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Vigentes hasta {expiryMonth} {expiryYear}
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

      <div className="flex justify-between text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
        <span>Nivel {tierLabel}</span>
        {tierNext ? (
          <span>{pointsToNext.toLocaleString()} pts para {tierNext}</span>
        ) : (
          <span>Nivel máximo ✦</span>
        )}
      </div>
    </div>
  );
}
