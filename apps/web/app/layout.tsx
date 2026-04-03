import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LoyaltyOS — Turn Every Visit Into a Reason to Come Back',
  description:
    'White-label loyalty and membership platform for local businesses. Branded member app, automated retention campaigns, real-time analytics. Ready in days, not months.',
  keywords:
    'loyalty program software, customer retention, white label loyalty app, membership management, local business loyalty, spa loyalty program, restaurant rewards, gym membership app',
  metadataBase: new URL('https://loyalbase.dev'),
  openGraph: {
    title: 'LoyaltyOS — Loyalty Platform for Local Businesses',
    description: 'Turn every visit into a reason to come back.',
    url: 'https://loyalbase.dev',
    siteName: 'LoyaltyOS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoyaltyOS',
    description: 'Turn every visit into a reason to come back.',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-brand-dark antialiased font-sans">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
