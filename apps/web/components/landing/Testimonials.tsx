'use client';

import { useEffect, useRef } from 'react';

// TODO: Replace with real testimonials when available
const TESTIMONIALS = [
  {
    quote:
      'We recovered 40 clients in the first month who hadn\'t visited in over 30 days. The campaigns literally paid for the subscription in week one.',
    name: 'Sarah M.',
    business: 'Owner, Serenity Spa & Wellness',
  },
  {
    quote:
      "My customers actually use this. I've tried loyalty apps before and nobody signed up. With LoyaltyOS the QR code gets scanned every day.",
    name: 'Carlos R.',
    business: "Owner, Don Mario's Pizzeria",
  },
  {
    quote:
      'The dashboard showed me Wednesday at 7pm is my busiest slot. I never knew that. Now I run double-points on Tuesdays to fill the gap.',
    name: 'Maria L.',
    business: 'Owner, FitLife Gym & Studio',
  },
];

function Stars() {
  return (
    <div className="flex gap-1 mb-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-stagger]').forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = '1';
                (el as HTMLElement).style.transform = 'translateY(0)';
              }, i * 100);
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
    <section ref={sectionRef} className="py-24 px-6" style={{ background: '#0d0d18' }}>
      <div className="max-w-6xl mx-auto">
        <div
          data-stagger
          className="text-center mb-4"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.5s, transform 0.5s' }}
        >
          <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">
            Social Proof
          </span>
        </div>
        <div
          data-stagger
          className="text-center mb-16"
          style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}
        >
          <h2 className="font-display font-black text-white" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            What business owners say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
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
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}
            >
              <Stars />
              <blockquote className="text-white/80 text-sm italic leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div>
                <div className="font-semibold text-white text-sm">{t.name}</div>
                <div className="text-white/40 text-xs mt-0.5">{t.business}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
