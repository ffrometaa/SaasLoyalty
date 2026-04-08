'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'loyalty_ob_v1';

interface OnboardingModalProps {
  memberName: string;
  appName: string;
  isNewMember: boolean;
}

const STEPS = [
  {
    emoji: '👋',
    title: (name: string) => `¡Bienvenida, ${name.split(' ')[0]}!`,
    subtitle: (_appName: string) => 'Tu programa de fidelidad',
    body: 'Acumulá puntos en cada visita, canjeá premios exclusivos y subí de nivel. Todo desde acá.',
  },
  {
    emoji: '⭐',
    title: () => 'Ganá puntos',
    subtitle: () => 'En cada visita al local',
    body: 'Cada vez que visitás el negocio, sumás puntos automáticamente. Cuantos más puntos, más beneficios.',
  },
  {
    emoji: '🎁',
    title: () => 'Canjeá premios',
    subtitle: () => 'Usá tus puntos',
    body: 'Convertí tus puntos en descuentos, productos y servicios gratuitos. Explorá el catálogo de premios.',
  },
  {
    emoji: '🏆',
    title: () => '¡Ya podés empezar!',
    subtitle: () => 'Explorá la app',
    body: 'Encontrás tus desafíos personalizados, el ranking con otros miembros y tu perfil completo.',
  },
];

export function OnboardingModal({ memberName, appName, isNewMember }: OnboardingModalProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

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
        <div
          className="h-1.5 w-full"
          style={{ background: 'var(--brand-primary, #3a4332)' }}
        />

        <div className="px-6 pt-6 pb-8">
          {/* Skip */}
          <div className="flex justify-end mb-4">
            <button
              onClick={dismiss}
              className="text-xs font-medium px-2 py-1 rounded-lg"
              style={{ color: 'var(--muted, #9ca3af)' }}
            >
              Saltar
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
              {current.title(memberName)}
            </h2>
            <p
              className="text-sm font-medium mb-3"
              style={{ color: 'var(--brand-primary, #3a4332)' }}
            >
              {current.subtitle(appName)}
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
            style={{
              background: 'var(--brand-primary, #3a4332)',
              color: 'white',
            }}
          >
            {isLast ? '¡Empezar!' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
