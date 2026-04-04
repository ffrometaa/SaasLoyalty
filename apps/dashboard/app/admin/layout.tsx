import { verifyAdminAccess } from '@/lib/admin/guard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Super Admin — LoyaltyOS',
};

export default async function AdminLayout({ children = null }) {
  // Full server-side guard — redirects to /login if not an active super admin
  const admin = await verifyAdminAccess();

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex">
      <AdminSidebar admin={admin} />
      <div className="flex-1 flex flex-col lg:pl-64">
        <AdminHeader admin={admin} title={null} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
