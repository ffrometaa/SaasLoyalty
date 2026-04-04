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
      <SuperAdminBanner />
      <Sidebar />
      <main className="lg:pl-64">
        {children}
      </main>
    </div>
  );
}
