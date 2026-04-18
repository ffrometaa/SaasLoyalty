'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const VISIT_VALUES = [42, 58, 65, 71, 98, 112, 55];
const TOP_PRODUCTS_SALES = [312, 256, 190];
const TOP_PRODUCTS_PCT = [100, 82, 61];

const ALERT_COLORS = [
  { color: '#e11d48', glow: 'rgba(225,29,72,0.5)' },
  { color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  { color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
];

interface MetricProps {
  label: string;
  target: number;
  suffix?: string;
  active: boolean;
}

function Metric({ label, target, suffix = '', active }: MetricProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1500;
    const start = performance.now();
    const raf = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [active, target]);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div className="text-white/40 text-xs tracking-wide mb-1">{label}</div>
      <div className="font-display font-black text-white text-2xl">
        {value.toLocaleString()}{suffix}
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const t = useTranslations('dashboardPreview');
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const visitData = [
    { day: t('dayMon'), visits: VISIT_VALUES[0] },
    { day: t('dayTue'), visits: VISIT_VALUES[1] },
    { day: t('dayWed'), visits: VISIT_VALUES[2] },
    { day: t('dayThu'), visits: VISIT_VALUES[3] },
    { day: t('dayFri'), visits: VISIT_VALUES[4] },
    { day: t('daySat'), visits: VISIT_VALUES[5] },
    { day: t('daySun'), visits: VISIT_VALUES[6] },
  ];

  const topProducts = [
    { name: t('product1'), sales: TOP_PRODUCTS_SALES[0], pct: TOP_PRODUCTS_PCT[0] },
    { name: t('product2'), sales: TOP_PRODUCTS_SALES[1], pct: TOP_PRODUCTS_PCT[1] },
    { name: t('product3'), sales: TOP_PRODUCTS_SALES[2], pct: TOP_PRODUCTS_PCT[2] },
  ];

  const alerts = [
    { ...ALERT_COLORS[0], text: t('alert1') },
    { ...ALERT_COLORS[1], text: t('alert2') },
    { ...ALERT_COLORS[2], text: t('alert3') },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true);
            if (sectionRef.current) {
              sectionRef.current.style.opacity = '1';
              sectionRef.current.style.transform = 'scale(1)';
            }
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 px-6" style={{ background: '#080810' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <span className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
            {t('badge')}
          </span>
        </div>
        <div className="text-center mb-3">
          <h2 className="font-display font-black text-white" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            {t('title')}
          </h2>
        </div>
        <div className="text-center mb-12">
          <p className="text-white/50 text-lg">{t('subtitle')}</p>
        </div>

        {/* Dashboard card */}
        <div
          ref={sectionRef}
          style={{
            background: '#0d0d14',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            padding: '24px',
            opacity: 0,
            transform: 'scale(0.97)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left — 70% */}
            <div className="flex-1 min-w-0">
              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Metric label={t('metricMembers')} target={1284} active={active} />
                <Metric label={t('metricVisits')} target={3891} active={active} />
                <Metric label={t('metricPoints')} target={48320} active={active} />
                <Metric label={t('metricRetention')} target={78} suffix="%" active={active} />
              </div>

              {/* Bar chart */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div className="text-xs font-semibold text-white/40 mb-4 tracking-wide uppercase">
                  {t('chartTitle')}
                </div>
                <div style={{ height: 180 }} className="flex flex-col justify-end gap-0">
                  <div className="flex items-end gap-1.5 h-36 px-1">
                    {visitData.map((d, i) => {
                      const maxVal = Math.max(...VISIT_VALUES);
                      const heightPct = Math.round((d.visits / maxVal) * 100);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <div
                            className="w-full rounded-t transition-all duration-700"
                            style={{
                              height: active ? `${heightPct}%` : '0%',
                              background: 'linear-gradient(180deg, #9f67ff, #7c3aed)',
                              opacity: 0.75 + i * 0.035,
                              transitionDelay: `${i * 60}ms`,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 px-1 mt-1">
                    {visitData.map((d, i) => (
                      <div key={i} className="flex-1 text-center" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                        {d.day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — 30% */}
            <div className="lg:w-64 flex flex-col gap-4">
              {/* Top products */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div className="text-xs font-semibold text-white/40 mb-4 tracking-wide uppercase">
                  {t('topProductsTitle')}
                </div>
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70 truncate">{p.name}</span>
                        <span className="text-white/40 ml-2">{p.sales}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${p.pct}%`,
                            background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '16px',
                  flex: 1,
                }}
              >
                <div className="text-xs font-semibold text-white/40 mb-4 tracking-wide uppercase">
                  {t('alertsTitle')}
                </div>
                <div className="space-y-3">
                  {alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="mt-1 w-2 h-2 rounded-full shrink-0"
                        style={{ background: a.color, boxShadow: `0 0 6px ${a.glow}` }}
                      />
                      <span className="text-white/65 text-xs leading-snug">{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* See your dashboard link */}
        <div className="text-center mt-8">
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold gradient-text hover:opacity-80 transition-opacity"
          >
            {t('cta')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
