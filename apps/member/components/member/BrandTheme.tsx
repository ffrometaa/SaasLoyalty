'use client';

import { useEffect } from 'react';

interface BrandThemeProps {
  primary: string;
  secondary: string;
}

function darken(hex: string, amount = 0.3): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string, amount = 0.85): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * amount));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function BrandTheme({ primary, secondary }: BrandThemeProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-secondary', secondary);
    root.style.setProperty('--brand-primary-dark', darken(primary, 0.25));
    root.style.setProperty('--brand-primary-light', lighten(primary, 0.82));
  }, [primary, secondary]);

  return null;
}
