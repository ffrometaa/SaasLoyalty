'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function FoundingPartners() {
  const t = useTranslations('founding');
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/founding-spots')
      .then((r) => r.json())
      .then((d) => setRemaining(d.remaining ?? 0))
      .catch(() => setRemaining(0));
  }, []);

  const spotsText =
    remaining === null
      ? '...'
      : remaining === 0
      ? t('spotsNone')
      : t('spotsLeft', { count: remaining });

  const isSoldOut = remaining === 0;

  const PRICES = [
    { plan: 'Starter', was: t('starterWas'), now: t('starterNow') },
    { plan: 'Pro', was: t('proWas'), now: t('proNow') },
    { plan: 'Scale', was: t('scaleWas'), now: t('scaleNow') },
  ];

  const BENEFITS = [
    t('benefit0'),
    t('benefit1'),
    t('benefit2'),
    t('benefit3'),
  ];

  return (
    <section
      id="founding"
      className="py-24 px-6"
      style={{ background: 'linear-gradient(180deg, #080810 0%, #0a0a18 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400" />
            </span>
            {t('badge')}
          </div>

          <h2 className="font-display font-black text-white mb-3" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            {t('heading')}
          </h2>
          <p className="text-white/50 text-lg mb-4">{t('subheading')}</p>

          {/* Spots counter */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
            style={{
              background: isSoldOut ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
              border: `1px solid ${isSoldOut ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`,
              color: isSoldOut ? '#f87171' : '#34d399',
            }}
          >
            {!isSoldOut && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            {spotsText}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Benefits */}
          <div
            className="p-8 rounded-2xl"
            style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="font-display font-bold text-white text-lg mb-6">
              What you get as a Founding Partner
            </h3>
            <ul className="space-y-4">
              {BENEFITS.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <svg className="w-5 h-5 mt-0.5 shrink-0 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs text-white/30 mb-1">{t('priceNote')}</p>
            </div>
          </div>

          {/* Pricing with discounts */}
          <div className="space-y-3">
            {PRICES.map(({ plan, was, now }) => (
              <div
                key={plan}
                className="flex items-center justify-between px-6 py-4 rounded-xl"
                style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="font-semibold text-white">{plan}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-white/30 line-through text-sm">{was}{t('perMonth')}</span>
                  <span className="font-display font-black text-2xl text-white">{now}</span>
                  <span className="text-white/40 text-sm">{t('perMonth')}</span>
                </div>
              </div>
            ))}

            <Link
              href={isSoldOut ? '/register' : '/register?source=founding'}
              className="block w-full text-center py-4 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] mt-2"
              style={
                isSoldOut
                  ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
                  : { background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: '#fff', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }
              }
            >
              {isSoldOut ? t('spotsNone') : t('cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
