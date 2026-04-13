'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function FAQ() {
  const t = useTranslations('faq');
  const [open, setOpen] = useState<number | null>(null);

  const FAQS = Array.from({ length: 7 }, (_, i) => ({
    q: t(`item${i}_q` as Parameters<typeof t>[0]),
    a: t(`item${i}_a` as Parameters<typeof t>[0]),
  }));

  return (
    <section className="py-24 px-6" style={{ background: '#0a0a0f' }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <span className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
            {t('label')}
          </span>
        </div>
        <div className="text-center mb-16">
          <h2 className="font-display font-black text-white" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            {t('heading')}
          </h2>
        </div>

        <div className="space-y-0">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <button
                className="w-full flex items-center justify-between py-5 text-left gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className="font-medium text-base transition-colors duration-200"
                  style={{ color: open === i ? '#a78bfa' : 'rgba(255,255,255,0.85)' }}
                >
                  {faq.q}
                </span>
                <svg
                  className="w-5 h-5 text-white/30 shrink-0 transition-transform duration-200"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                className="overflow-hidden"
                style={{
                  maxHeight: open === i ? '400px' : '0',
                  transition: 'max-height 0.3s ease',
                }}
              >
                <p className="text-white/55 text-sm leading-relaxed pb-5">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
