import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { RedemptionsPageClient } from './RedemptionsPageClient';
import type { HistoryItem } from './RedemptionsPageClient';

interface RedemptionRow {
  id: string;
  status: string;
  used_at: string | null;
  created_at: string;
  members: { name: string } | null;
  rewards: { name: string } | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export default async function RedemptionsPage(): Promise<JSX.Element> {
  const user = await getAuthedUser();

  let initialHistory: HistoryItem[] = [];
  let initialTodayCount = 0;

  if (user) {
    // Service role required: initial redemptions fetch for Server Component — no session available at server render time
    const service = createServiceRoleClient();

    const { data: ownerTenant, error: ownerError } = await service
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();
    if (ownerError) console.error('[RedemptionsPage] tenant lookup error:', ownerError);

    let tenantId: string | null = ownerTenant?.id ?? null;

    if (!tenantId) {
      const { data: staffRecord, error: staffError } = await service
        .from('tenant_users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      if (staffError) console.error('[RedemptionsPage] staff lookup error:', staffError);
      tenantId = staffRecord?.tenant_id ?? null;
    }

    if (tenantId) {
      const todayISO = new Date().toISOString().slice(0, 10);
      const todayStart = `${todayISO}T00:00:00.000Z`;

      const [recentResult, todayResult] = await Promise.all([
        service
          .from('redemptions')
          .select('id, status, used_at, created_at, members(name), rewards(name)')
          .eq('tenant_id', tenantId)
          .eq('status', 'used')
          .order('used_at', { ascending: false })
          .limit(10)
          .returns<RedemptionRow[]>(),
        service
          .from('redemptions')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'used')
          .gte('used_at', todayStart),
      ]);

      if (recentResult.error) console.error('[RedemptionsPage] recent redemptions error:', recentResult.error);
      if (todayResult.error) console.error('[RedemptionsPage] today count error:', todayResult.error);

      if (recentResult.data) {
        initialHistory = recentResult.data.map((r: RedemptionRow) => ({
          id: r.id,
          member: r.members?.name ?? 'Unknown',
          reward: r.rewards?.name ?? 'Unknown reward',
          status: r.status,
          time: timeAgo(r.used_at ?? r.created_at),
        }));
      }

      initialTodayCount = todayResult.count ?? 0;
    }
  }

  return <RedemptionsPageClient initialHistory={initialHistory} initialTodayCount={initialTodayCount} />;
}
