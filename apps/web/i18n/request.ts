import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const VALID_LOCALES = ['en', 'es'] as const;
type Locale = (typeof VALID_LOCALES)[number];

export default getRequestConfig(async () => {
  // Next.js 14: cookies() is synchronous
  const cookieStore = cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value;
  const locale: Locale = VALID_LOCALES.includes(raw as Locale) ? (raw as Locale) : 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
