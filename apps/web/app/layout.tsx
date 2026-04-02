import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LoyaltyOS - SaaS White-Label Loyalty Platform',
  description: 'Build customer loyalty with points, rewards, and automated reactivation campaigns.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
