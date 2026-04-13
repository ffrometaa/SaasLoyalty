'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ParticleField } from './ParticleField';

export function HeroSection() {
  const t = useTranslations('hero');
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elements = heroRef.current?.querySelectorAll('[data-hero-anim]');
    if (!elements) return;
    elements.forEach((el, i) => {
      (el as HTMLElement).style.animationDelay = `${i * 200}ms`;
      (el as HTMLElement).style.animationFillMode = 'forwards';
    });
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      <ParticleField />

      {/* Radial glow behind orb */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(124,58,237,0.25) 0%, rgba(37,99,235,0.15) 35%, rgba(225,29,72,0.1) 60%, transparent 80%)',
          zIndex: 1,
        }}
      />

      {/* Central orb */}
      <div
        className="absolute"
        style={{
          width: 'clamp(320px, 50vw, 640px)',
          height: 'clamp(320px, 50vw, 640px)',
          borderRadius: '50%',
          background: '#0a0d15',
          boxShadow:
            '0 0 80px rgba(124,58,237,0.3), 0 0 160px rgba(37,99,235,0.2), inset 0 0 60px rgba(0,0,0,0.8)',
          animation: 'pulseGlow 3s ease infinite alternate',
          zIndex: 2,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <div
          data-hero-anim
          className="font-display font-black text-white uppercase leading-none tracking-tighter"
          style={{
            fontSize: 'clamp(52px, 10vw, 120px)',
            opacity: 0,
            animation: 'fadeUp 0.7s ease',
          }}
        >
          {t('line1')}
        </div>

        <div
          data-hero-anim
          className="font-display font-black leading-none tracking-tighter gradient-text"
          style={{
            fontSize: 'clamp(52px, 10vw, 120px)',
            opacity: 0,
            animation: 'fadeUp 0.7s ease',
            backgroundSize: '200% auto',
          }}
        >
          LoyaltyOS
        </div>

        <p
          data-hero-anim
          className="mt-6 text-white/70 leading-relaxed max-w-xl mx-auto"
          style={{
            fontSize: 'clamp(15px, 2vw, 20px)',
            opacity: 0,
            animation: 'fadeUp 0.7s ease',
          }}
        >
          {t('description')}
        </p>

        <div
          data-hero-anim
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ opacity: 0, animation: 'fadeUp 0.7s ease' }}
        >
          <Link
            href="/pricing"
            className="px-8 py-3.5 rounded-full font-semibold text-white text-base transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #e11d48, #7c3aed)',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
              minWidth: '140px',
              textAlign: 'center',
            }}
          >
            {t('ctaPricing')}
          </Link>
          <Link
            href="/contact"
            className="px-8 py-3.5 rounded-full font-semibold text-white text-base transition-all duration-200 hover:scale-105 hover:bg-white/10"
            style={{
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent',
              minWidth: '160px',
              textAlign: 'center',
            }}
          >
            {t('ctaDemo')}
          </Link>
        </div>
      </div>

      {/* Bottom status indicators — bottom left */}
      <div
        className="absolute bottom-8 left-8 z-10 flex flex-col gap-2 hidden sm:flex"
        style={{ opacity: 0, animation: 'fadeUp 0.7s ease 1.2s forwards' }}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
            />
          </svg>
          <div>
            <div className="text-xs tracking-widest text-white/30 uppercase">{t('statusLabel')}</div>
            <div className="text-xs font-bold tracking-widest text-white/50 uppercase">
              {t('statusValue')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
          <div>
            <div className="text-xs tracking-widest text-white/30 uppercase">{t('sectorLabel')}</div>
            <div className="text-xs font-bold tracking-widest text-white/50 uppercase">
              {t('sectorValue')}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom right — trust count */}
      <div
        className="absolute bottom-8 right-8 z-10 text-right hidden sm:block"
        style={{ opacity: 0, animation: 'fadeUp 0.7s ease 1.4s forwards' }}
      >
        <div
          className="font-display font-black text-white/10 leading-none"
          style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}
        >
          14
        </div>
        <div className="text-xs tracking-widest text-white/30 uppercase">{t('trustLabel')}</div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { transform: translate(-50%, -50%) scale(1); }
          100% { transform: translate(-50%, -50%) scale(1.05); }
        }
      `}</style>
    </section>
  );
}
