import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import Script from 'next/script';
import './globals.css';

const GA_ID = 'G-GZNJ7ES3XS';

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
  title: 'LoyalBase — Turn Every Visit Into a Reason to Come Back',
  description:
    'White-label loyalty and membership platform for local businesses. Branded member app, automated retention campaigns, real-time analytics. Ready in days, not months.',
  keywords:
    'loyalty program software, customer retention, white label loyalty app, membership management, local business loyalty, spa loyalty program, restaurant rewards, gym membership app',
  metadataBase: new URL('https://loyalbase.dev'),
  alternates: {
    canonical: 'https://loyalbase.dev',
  },
  openGraph: {
    title: 'LoyalBase — Loyalty Platform for Local Businesses',
    description: 'Turn every visit into a reason to come back.',
    url: 'https://loyalbase.dev',
    siteName: 'LoyalBase',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'LoyalBase - Loyalty Platform for Local Businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoyalBase',
    description: 'Turn every visit into a reason to come back.',
    images: ['/opengraph-image'],
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LoyalBase',
  url: 'https://loyalbase.dev',
  description:
    'White-label loyalty and membership platform for local businesses. Branded member app, automated retention campaigns, and real-time analytics.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'St. Petersburg',
    addressRegion: 'FL',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@loyalbase.dev',
  },
};

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LoyalBase',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android (PWA)',
  url: 'https://loyalbase.dev',
  description:
    'White-label loyalty platform for local businesses. Branded member PWA, points & rewards engine, automated retention campaigns, and real-time analytics. Ready in days, not months.',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '99',
    highPrice: '599',
    offerCount: '3',
  },
  featureList: [
    'Branded Member App (PWA)',
    'Points & Rewards Engine',
    'Automated Retention Campaigns',
    'Real-time Analytics Dashboard',
    'QR Code Onboarding',
    'Push Notifications & Email',
    'White-label Customization',
    'Gamification Engine',
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
      </head>
      <body className="min-h-screen bg-brand-dark antialiased font-sans">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </body>
    </html>
  );
}
