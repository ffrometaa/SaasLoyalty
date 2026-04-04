'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function PricingPreview() {
  const t = useTranslations('pricing');
  const [annual, setAnnual] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const PLANS = [
    {
      name: t('plan0_name'),
      monthly: 79,
      annual: 66,
      subtitle: t('plan0_subtitle'),
      features: [t('plan0_f0'), t('plan0_f1'), t('plan0_f2'), t('plan0_f3'), t('plan0_f4')],
      highlight: false,
      enterprise: false,
    },
    {
      name: t('plan1_name'),
      monthly: 199,
      annual: 166,
      subtitle: t('plan1_subtitle'),
      features: [t('plan1_f0'), t('plan1_f1'), t('plan1_f2'), t('plan1_f3'), t('plan1_f4'), t('plan1_f5')],
      highlight: true,
      enterprise: false,
    },
    {
      name: t('plan2_name'),
      monthly: 399,
      annual: 332,
      subtitle: t('plan2_subtitle'),
      features: [t('plan2_f0'), t('plan2_f1'), t('plan2_f2'), t('plan2_f3'), t('plan2_f4'), t('plan2_f5')],
      highlight: false,
      enterprise: false,
    },
    {
      name: t('plan3_name'),
      monthly: null,
      annual: null,
      subtitle: t('plan3_subtitle'),
      features: [t('plan3_f0'), t('plan3_f1'), t('plan3_f2'), t('plan3_f3'), t('plan3_f4'), t('plan3_f5')],
      highlight: false,
      enterprise: true,
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-stagger]').forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = '1';
                (el as HTMLElement).style.transform = 'translateY(0)';
              }, i * 80);
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
    <section ref={sectionRef} id="pricing" className="py-24 px-6" style={{ background: '#080810' }}>
      <div className="max-w-6xl mx-auto">
        <div
          data-stagger
          className="text-center mb-4"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.5s, transform 0.5s' }}
        >
          <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">
            {t('label')}
          </span>
        </div>
        <div
          data-stagger
          className="text-center mb-3"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}
        >
          <h2 className="font-display font-black text-white" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            {t('heading')}
          </h2>
        </div>
        <div
          data-stagger
          className="text-center mb-10"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}
        >
          <p className="text-white/50 text-lg">{t('subheading')}</p>
        </div>

        {/* Toggle */}
        <div
          data-stagger
          className="flex flex-wrap items-center justify-center gap-3 w-full mb-12"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.5s, transform 0.5s' }}
        >
          <span className={`text-sm font-medium leading-none ${!annual ? 'text-white' : 'text-white/40'}`}>{t('monthly')}</span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative inline-flex items-center h-7 w-14 rounded-full flex-shrink-0 transition-colors duration-300 focus:outline-none"
            style={{ background: annual ? '#7c3aed' : 'rgba(255,255,255,0.15)' }}
          >
            <span
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
              style={{ transform: annual ? 'translateX(30px) translateY(-50%)' : 'translateX(2px) translateY(-50%)' }}
            />
          </button>
          <span className={`text-sm font-medium leading-none ${annual ? 'text-white' : 'text-white/40'}`}>{t('annual')}</span>
          {annual && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 bg-emerald-400/10 text-emerald-400 border border-emerald-400/40">
              {t('save')}
            </span>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              data-stagger
              style={{
                background: plan.enterprise ? 'linear-gradient(135deg, #0d0d1a, #111128)' : '#0d0d14',
                border: plan.highlight
                  ? 'none'
                  : plan.enterprise
                  ? '1px solid rgba(124,58,237,0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '28px',
                position: 'relative',
                opacity: 0,
                transform: 'translateY(30px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease, box-shadow 0.2s',
              }}
              className={plan.highlight ? 'gradient-border hover:-translate-y-1.5 flex flex-col h-full' : 'hover:-translate-y-1 flex flex-col h-full'}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                  >
                    {t('mostPopular')}
                  </span>
                </div>
              )}

              {plan.enterprise && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                  >
                    Enterprise
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="font-display font-bold text-white text-xl mb-1">{plan.name}</div>
                <div className="text-white/40 text-sm">{plan.subtitle}</div>
              </div>

              <div className="mb-6">
                {plan.enterprise ? (
                  <div>
                    <span className="font-display font-black text-white text-2xl">{t('plan3_price')}</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-display font-black text-white text-4xl">
                      ${annual ? plan.annual : plan.monthly}
                    </span>
                    <span className="text-white/40 text-sm">{t('perMonth')}</span>
                    {annual && (
                      <div className="text-white/30 text-xs mt-1">{t('billedAnnually')}</div>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                    <svg
                      className={`w-4 h-4 mt-0.5 shrink-0 ${plan.enterprise ? 'text-indigo-400' : 'text-purple-400'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.enterprise ? (
                <div
                  className="block w-full text-center py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.35)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'default',
                  }}
                >
                  {t('plan3_cta')}
                </div>
              ) : (
                <Link
                  href="/register"
                  className="block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                  style={
                    plan.highlight
                      ? {
                          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                          color: '#fff',
                          boxShadow: '0 0 20px rgba(124,58,237,0.35)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.06)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }
                  }
                >
                  {t('startTrial')}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8 text-white/30 text-sm">
          {t('footer')}
        </div>
      </div>
    </section>
  );
}
