import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { SettingsClient } from '@/components/admin/SettingsClient';

export const dynamic = 'force-dynamic';

interface PlatformConfig {
  trial_period_days: number;
  grace_period_days: number;
  points_expiry_days: number;
  reactivation_threshold_days: number;
  max_payment_retries: number;
  maintenance_mode: boolean;
  registration_open: boolean;
  trial_enabled: boolean;
  email_from_name: string;
  email_from_address: string;
}

async function getSettings(): Promise<PlatformConfig | null> {
  const service = createServiceRoleClient();

  const { data: config } = await service
    .from('platform_config')
    .select('trial_period_days, grace_period_days, points_expiry_days, reactivation_threshold_days, max_payment_retries, maintenance_mode, registration_open, trial_enabled, email_from_name, email_from_address')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()
    .returns<PlatformConfig>();

  return config;
}

export default async function AdminSettingsPage() {
  const admin = await verifyAdminAccess();
  const config = await getSettings();

  if (!config) {
    return (
      <div className="p-6 text-red-400 text-sm">
        Platform configuration unavailable. Please check the database.
      </div>
    );
  }

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
