'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'Do my customers need to download an app?',
    a: 'No. LoyaltyOS is a Progressive Web App (PWA). Customers access it directly from their browser and can add it to their home screen in one tap — no App Store required, no friction for your customers.',
  },
  {
    q: 'Does it work with my existing booking system?',
    a: 'Yes. LoyaltyOS integrates with Square, Vagaro, Acuity, Fresha, and Calendly. If your system isn\'t listed, customers can still earn points manually via QR scan at point of service.',
  },
  {
    q: 'What does "white-label" mean exactly?',
    a: "Your customers see your business name, your logo, and your colors — not LoyaltyOS. It looks and feels like a loyalty app you built yourself, at a fraction of the cost.",
  },
  {
    q: 'How quickly can I get started?',
    a: 'Most businesses are fully live within 24 to 48 hours. We handle the entire setup — you just share a QR code with your first customer.',
  },
  {
    q: 'Is my customer data secure?',
    a: 'Yes. We use bank-level encryption in transit and at rest, database-level isolation between all business accounts, and we never sell or share your customer data under any circumstances.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your dashboard at any time. No long-term contracts, no cancellation fees. Your data remains available for export for 90 days after cancellation.',
  },
  {
    q: 'What happens when my free trial ends?',
    a: "You'll receive an email reminder 3 days before your trial ends. If you don't add a payment method, your account is paused — not deleted. Your data stays safe for 30 days.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 px-6" style={{ background: '#0a0a0f' }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">
            FAQ
          </span>
        </div>
        <div className="text-center mb-16">
          <h2 className="font-display font-black text-white" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            Frequently asked questions
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
