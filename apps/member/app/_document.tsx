import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LoyaltyOS" />
        <meta name="application-name" content="LoyaltyOS Member" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#6366f1" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.svg" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.svg" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/icons/icon-192.svg" />
        <link rel="shortcut icon" type="image/svg+xml" href="/icons/icon-192.svg" />
        
        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="LoyaltyOS Member" />
        <meta property="og:description" content="View your loyalty points and redeem rewards" />
        <meta property="og:site_name" content="LoyaltyOS" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="LoyaltyOS Member" />
        <meta name="twitter:description" content="View your loyalty points and redeem rewards" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
