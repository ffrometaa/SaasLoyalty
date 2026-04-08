'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface TrialBannerProps {
  feature: 'gamification' | 'heatmap';
  trialEnd: string; // ISO string
}

const FEATURE_LABELS: Record<string, string> = {
  gamification: 'Gamification Engine',
  heatmap:      'Heatmap Analytics',
};

export function TrialBanner({ feature, trialEnd }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          Trial activo
        </span>
        <p className="text-sm text-violet-800 truncate">
          <span className="font-semibold">{FEATURE_LABELS[feature]}</span>
          {' — '}
          {daysLeft > 0 ? (
            <>te quedan <span className="font-semibold">{daysLeft} días</span> de prueba gratuita.</>
          ) : (
            <>tu trial vence hoy.</>
          )}
          {' '}
          <a href="/settings?tab=billing" className="underline underline-offset-2 hover:text-violet-900 transition-colors">
            Upgradear ahora
          </a>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded-md text-violet-500 hover:text-violet-700 hover:bg-violet-100 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
