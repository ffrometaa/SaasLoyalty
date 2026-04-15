import { verifyAdminAccess } from '@/lib/admin/guard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Super Admin — LoyaltyOS',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Full server-side guard — redirects to /login if not an active super admin
  const admin = await verifyAdminAccess();

  return (
    <AdminShell admin={admin} header={<AdminHeader admin={admin} title={null} />}>
      {children}
    </AdminShell>
  );
}
