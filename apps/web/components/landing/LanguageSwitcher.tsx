'use client';

import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale();

  function switchLocale(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=lax`;
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => switchLocale('en')}
        className={`text-xs font-bold tracking-widest px-1.5 py-0.5 rounded transition-colors ${
          locale === 'en' ? 'text-white' : 'text-white/30 hover:text-white/60'
        }`}
      >
        EN
      </button>
      <span className="text-white/20 text-xs leading-none">|</span>
      <button
        onClick={() => switchLocale('es')}
        className={`text-xs font-bold tracking-widest px-1.5 py-0.5 rounded transition-colors ${
          locale === 'es' ? 'text-white' : 'text-white/30 hover:text-white/60'
        }`}
      >
        ES
      </button>
    </div>
  );
}
