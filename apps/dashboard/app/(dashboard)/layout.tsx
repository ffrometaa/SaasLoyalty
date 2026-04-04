import type { Metadata } from 'next';
import { Sidebar } from '../../components/Sidebar';
import { SuperAdminBanner } from '../../components/SuperAdminBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard - LoyaltyOS',
  description: 'Manage your loyalty program',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <SuperAdminBanner />
        <main className="flex-1 pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
