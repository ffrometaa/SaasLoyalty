'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

const ICONS = [
  (
    <svg key={0} className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  (
    <svg key={1} className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  (
    <svg key={2} className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
];

export function ProblemSection() {
  const t = useTranslations('problem');
  const sectionRef = useRef<HTMLElement>(null);

  const CARDS = [
    { icon: ICONS[0], title: t('item0_title'), body: t('item0_body') },
    { icon: ICONS[1], title: t('item1_title'), body: t('item1_body') },
    { icon: ICONS[2], title: t('item2_title'), body: t('item2_body') },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const animated = entry.target.querySelectorAll('[data-stagger]');
            animated.forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = '1';
                (el as HTMLElement).style.transform = 'translateY(0)';
              }, i * 80);
            });
          }
        });
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6" style={{ background: '#0a0a0f' }}>
      <div className="max-w-6xl mx-auto">
        <div
          data-stagger
          className="text-center mb-4"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
        >
          <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">
            {t('label')}
          </span>
        </div>

        <div
          data-stagger
          className="text-center mb-3"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
        >
          <h2 className="font-display font-black text-white" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            {t('heading')}
          </h2>
        </div>
        <div
          data-stagger
          className="text-center mb-16"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
        >
          <p className="text-white/50 text-xl font-light">{t('subheading')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CARDS.map((card, i) => (
            <div
              key={i}
              data-stagger
              style={{
                background: '#111118',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '28px',
                opacity: 0,
                transform: 'translateY(30px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease, border-color 0.2s ease, transform 0.2s ease',
              }}
              className="group cursor-default hover:border-white/20 hover:-translate-y-1"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, #e11d48, #7c3aed)' }}
              >
                {card.icon}
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-3 leading-snug">
                {card.title}
              </h3>
              <p className="text-white/55 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
