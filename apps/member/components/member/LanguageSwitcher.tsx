'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('langSwitch');

  function switchLocale(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=lax`;
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Globe className="h-5 w-5 text-gray-500" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{t('label')}</p>
      </div>
      <div className="flex gap-1">
        {(['es', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => switchLocale(l)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              locale === l
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t(l)}
          </button>
        ))}
      </div>
    </div>
  );
}
