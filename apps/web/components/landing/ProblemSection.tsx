'use client';

import { useEffect, useRef } from 'react';

const CARDS = [
  {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "No system to track who's coming back",
    body: 'Paper punch cards get lost. Spreadsheets don\'t send reminders. You\'re losing regulars silently, one missed visit at a time.',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    title: 'You\'re competing with chains that have $10M loyalty budgets',
    body: 'Starbucks, Sephora, and Marriott retain customers with sophisticated apps. Local businesses get nothing. Until now.',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    title: 'Every inactive customer is revenue you already paid for',
    body: 'You spent money to acquire them. Every day they don\'t return, your acquisition cost gets more expensive.',
  },
];

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);

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
        {/* Label */}
        <div
          data-stagger
          className="text-center mb-4"
          style={{
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">
            The Problem
          </span>
        </div>

        {/* Headline */}
        <div
          data-stagger
          className="text-center mb-3"
          style={{
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <h2 className="font-display font-black text-white" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            Your best customers walked out the door.
          </h2>
        </div>
        <div
          data-stagger
          className="text-center mb-16"
          style={{
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <p className="text-white/50 text-xl font-light">You didn&apos;t even notice.</p>
        </div>

        {/* Cards */}
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
              {/* Icon */}
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
