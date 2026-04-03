'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

const ICONS = [
  <svg key={0} className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
  </svg>,
  <svg key={1} className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>,
  <svg key={2} className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>,
];

export function HowItWorks() {
  const t = useTranslations('howItWorks');
  const sectionRef = useRef<HTMLElement>(null);

  const STEPS = [
    { num: '01', icon: ICONS[0], timeframe: t('step0_timeframe'), title: t('step0_title'), body: t('step0_body') },
    { num: '02', icon: ICONS[1], timeframe: t('step1_timeframe'), title: t('step1_title'), body: t('step1_body') },
    { num: '03', icon: ICONS[2], timeframe: t('step2_timeframe'), title: t('step2_title'), body: t('step2_body') },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-step]').forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = '1';
                (el as HTMLElement).style.transform = 'translateY(0)';
              }, i * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6" style={{ background: '#0a0a0f' }}>
      <div className="max-w-6xl mx-auto">
        <div
          data-step
          className="text-center mb-4"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.5s, transform 0.5s' }}
        >
          <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">
            {t('label')}
          </span>
        </div>
        <div
          data-step
          className="text-center mb-16"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}
        >
          <h2 className="font-display font-black text-white" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            {t('heading')}
          </h2>
        </div>

        <div className="relative flex flex-col md:flex-row gap-8 md:gap-0">
          <div
            className="hidden md:block absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px"
            style={{
              background: 'rgba(124,58,237,0.3)',
              borderTop: '1px dashed rgba(124,58,237,0.4)',
            }}
          />

          {STEPS.map((step, i) => (
            <div
              key={i}
              data-step
              className="relative flex-1 flex flex-col items-center text-center px-6"
              style={{
                opacity: 0,
                transform: 'translateY(30px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}
            >
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 font-display font-black text-white/[0.04] select-none pointer-events-none"
                style={{ fontSize: 'clamp(80px, 10vw, 120px)' }}
              >
                {step.num}
              </div>

              <div
                className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  boxShadow: '0 0 30px rgba(124,58,237,0.4)',
                }}
              >
                {step.icon}
              </div>

              <span
                className="mb-3 inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide"
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  color: 'rgba(167,139,250,0.9)',
                }}
              >
                {step.timeframe}
              </span>

              <h3 className="font-display font-bold text-white text-lg mb-3 leading-snug">
                {step.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
