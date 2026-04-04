import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { SettingsClient } from '@/components/admin/SettingsClient';

export const dynamic = 'force-dynamic';

async function getSettings() {
  const service = createServiceRoleClient();

  const { data: config } = await service
    .from('platform_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  return config;
}

export default async function AdminSettingsPage() {
  const admin = await verifyAdminAccess();
  const config = await getSettings();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Admin profile and platform configuration</p>
      </div>
      <SettingsClient admin={admin} config={config} />
    </div>
  );
}
