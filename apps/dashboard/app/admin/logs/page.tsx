import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { LogsTable } from '@/components/admin/LogsTable';

export const dynamic = 'force-dynamic';

async function getLogs() {
  const service = createServiceRoleClient();

  const { data: events } = await service
    .from('platform_events')
    .select('id, action_type, target_type, target_id, metadata, created_at, super_admins(id, full_name, email)')
    .order('created_at', { ascending: false })
    .limit(500);

  const { data: admins } = await service
    .from('super_admins')
    .select('id, full_name, email')
    .eq('is_active', true);

  return { events: events ?? [], admins: admins ?? [] };
}

export default async function AdminLogsPage() {
  await verifyAdminAccess();
  const { events, admins } = await getLogs();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">System Logs</h1>
        <p className="text-slate-400 mt-1">All platform admin events and actions</p>
      </div>
      <LogsTable initialEvents={events} admins={admins} />
    </div>
  );
}
