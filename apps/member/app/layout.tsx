import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale, getTranslations } from 'next-intl/server';
import './globals.css';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { ConsentGuard } from '@/components/consent-guard';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('title'),
    description: t('description'),
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: t('title'),
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3a4332',
};

async function getPendingConsentCount(): Promise<number> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user) return 0;

    // Service role required: server-side consent check — bypasses RLS for layout data
    const service = createServiceRoleClient();
    const { data: member } = await service
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .limit(1)
      .single();

    if (!member) return 0;

    const { data: pending } = await service.rpc('get_pending_consents', {
      p_member_id: member.id,
    });

    return pending?.length ?? 0;
  } catch {
    return 0;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<JSX.Element> {
  const locale = await getLocale();
  const messages = await getMessages();
  const pendingCount = await getPendingConsentCount();

  return (
    <html lang={locale} className={`${cormorant.variable} ${jost.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className="min-h-screen"
      >
        <NextIntlClientProvider messages={messages}>
          <ImpersonationBanner />
          <OfflineIndicator />
          <ConsentGuard pendingCount={pendingCount} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
