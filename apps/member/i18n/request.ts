import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const VALID_LOCALES = ['es', 'en'] as const;
type Locale = (typeof VALID_LOCALES)[number];

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value;
  // Member app defaults to English; user can switch to Spanish via LanguageSwitcher
  const locale: Locale = VALID_LOCALES.includes(raw as Locale) ? (raw as Locale) : 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
