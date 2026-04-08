'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'loyalty_ob_v1';

interface OnboardingModalProps {
  memberName: string;
  appName: string;
  isNewMember: boolean;
}

export function OnboardingModal({ memberName, appName, isNewMember }: OnboardingModalProps) {
  const t = useTranslations('onboarding');
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const firstName = memberName.split(' ')[0];

  const STEPS = [
    {
      emoji: '👋',
      title: t('step1Title', { name: firstName }),
      subtitle: t('step1Subtitle'),
      body: t('step1Body'),
    },
    {
      emoji: '⭐',
      title: t('step2Title'),
      subtitle: t('step2Subtitle'),
      body: t('step2Body'),
    },
    {
      emoji: '🎁',
      title: t('step3Title'),
      subtitle: t('step3Subtitle'),
      body: t('step3Body'),
    },
    {
      emoji: '🏆',
      title: t('step4Title'),
      subtitle: t('step4Subtitle'),
      body: t('step4Body'),
    },
  ];

  useEffect(() => {
    if (!isNewMember) return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // ignore — localStorage unavailable in SSR or private mode
    }
  }, [isNewMember]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    }, 280);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center transition-opacity duration-280 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => e.currentTarget === e.target && dismiss()}
    >
      <div
        className={`relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden transition-transform duration-280 ${exiting ? 'translate-y-8' : 'translate-y-0'}`}
        style={{ background: 'var(--cream, #faf9f6)' }}
      >
        {/* Decorative header bar */}
        <div className="h-1.5 w-full" style={{ background: 'var(--brand-primary, #3a4332)' }} />

        <div className="px-6 pt-6 pb-8">
          {/* Skip */}
          <div className="flex justify-end mb-4">
            <button
              onClick={dismiss}
              className="text-xs font-medium px-2 py-1 rounded-lg"
              style={{ color: 'var(--muted, #9ca3af)' }}
            >
              {t('skip')}
            </button>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  background: i === step
                    ? 'var(--brand-primary, #3a4332)'
                    : 'var(--border, #e5e7eb)',
                }}
              />
            ))}
          </div>

          {/* Emoji */}
          <div className="text-center mb-5">
            <span className="text-6xl">{current.emoji}</span>
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h2
              className="font-display font-light mb-1"
              style={{ fontSize: 26, color: 'var(--text, #1a1a1a)' }}
            >
              {current.title}
            </h2>
            <p
              className="text-sm font-medium mb-3"
              style={{ color: 'var(--brand-primary, #3a4332)' }}
            >
              {current.subtitle}
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--muted, #6b7280)' }}
            >
              {current.body}
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={next}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-opacity active:opacity-80"
            style={{ background: 'var(--brand-primary, #3a4332)', color: 'white' }}
          >
            {isLast ? t('start') : t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}
