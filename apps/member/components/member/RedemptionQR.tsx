'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { RedemptionResult } from '@/lib/member/types';

interface RedemptionQRProps {
  redemption: RedemptionResult;
}

export function RedemptionQR({ redemption }: RedemptionQRProps) {
  const t = useTranslations('redemptionQR');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, redemption.qr_data, {
      width: 148,
      margin: 1,
      color: {
        dark: '#2c2c2a',
        light: '#ffffff',
      },
    });
  }, [redemption.qr_data]);

  const expiryDate = new Date(redemption.expires_at).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 py-8 text-center"
      style={{ background: 'var(--cream)' }}
    >
      {/* Success circle */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-7 animate-fade-in-scale"
        style={{ background: 'var(--sage-light)', border: '2px solid var(--sage)' }}
      >
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--sage-dark)" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="font-display text-[32px] font-normal mb-2.5" style={{ color: 'var(--text)' }}>
        {t('success')}
      </h1>
      <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: 'var(--muted)' }}>
        {redemption.reward_name} · {t('showCode')}
      </p>

      {/* QR Code */}
      <div
        className="flex flex-col items-center justify-center p-4 mb-6 rounded-[20px]"
        style={{ background: 'white', border: '1px solid var(--border)', width: 180, height: 180 }}
      >
        <canvas ref={canvasRef} />
        <p className="text-xs mt-2 tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
          {t('scanOnArrival')}
        </p>
      </div>

      {/* Alphanumeric code */}
      <div
        className="rounded-xl px-6 py-3.5 mb-7 text-center"
        style={{ background: 'var(--clay-light)', border: '1px solid rgba(196,168,130,0.4)' }}
      >
        <p className="text-xs mb-1 tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
          {t('redeemCode')}
        </p>
        <p
          className="text-2xl font-medium tracking-[6px]"
          style={{ color: 'var(--clay-dark)', fontFamily: "'Jost', sans-serif" }}
        >
          {redemption.code}
        </p>
      </div>

      <p className="text-xs mb-8" style={{ color: 'var(--muted)' }}>
        {t('validUntil', { date: expiryDate })}
      </p>

      {/* Back to home */}
      <Link
        href="/"
        className="w-full max-w-xs py-3.5 rounded-[14px] text-sm font-medium text-center block"
        style={{ background: 'white', border: '1.5px solid var(--sage)', color: 'var(--sage-dark)' }}
      >
        {t('backToHome')}
      </Link>
    </div>
  );
}
