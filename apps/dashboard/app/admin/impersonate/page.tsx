import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { ImpersonatePanel } from '@/components/admin/ImpersonatePanel';

export const dynamic = 'force-dynamic';

async function getImpersonateData() {
  const service = createServiceRoleClient();

  const [
    { data: tenants },
    { data: members },
    { data: recentLogs },
  ] = await Promise.all([
    service
      .from('tenants')
      .select('id, business_name, slug, plan, plan_status, auth_user_id, created_at')
      .is('deleted_at', null)
      .not('auth_user_id', 'is', null)
      .order('business_name', { ascending: true })
      .limit(200),

    service
      .from('members')
      .select('id, tenant_id, email, name, tier, points_balance, status, tenants:tenant_id(business_name)')
      .eq('status', 'active')
      .order('name', { ascending: true })
      .limit(200),

    service
      .from('impersonation_logs')
      .select(`
        id,
        impersonation_level,
        started_at,
        ended_at,
        reason,
        target_member_id,
        target_tenant_id,
        super_admins:super_admin_id(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return {
    tenants: (tenants ?? []) as Array<{
      id: string;
      business_name: string;
      slug: string;
      plan: string;
      plan_status: string;
      auth_user_id: string;
      created_at: string;
    }>,
    members: (members ?? []).map((m: any) => ({
      id: m.id as string,
      tenant_id: m.tenant_id as string,
      tenant_name: (m.tenants as any)?.business_name ?? 'Unknown',
      email: m.email as string,
      name: m.name as string,
      tier: m.tier as string,
      points_balance: m.points_balance as number,
      status: m.status as string,
    })),
    recentLogs: (recentLogs ?? []).map((l: any) => ({
      id: l.id as string,
      impersonation_level: l.impersonation_level as string,
      started_at: l.started_at as string,
      ended_at: l.ended_at as string | null,
      reason: l.reason as string | null,
      target_member_id: l.target_member_id as string | null,
      target_tenant_id: l.target_tenant_id as string | null,
      admin_name: (l.super_admins as any)?.full_name ?? '',
      admin_email: (l.super_admins as any)?.email ?? '',
    })),
  };
}

export default async function ImpersonatePage() {
  await verifyAdminAccess();
  const data = await getImpersonateData();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Impersonation</h1>
        <p className="text-slate-400 mt-1">
          View the platform as any tenant owner or member · All sessions are fully audited
        </p>
      </div>
      <ImpersonatePanel
        tenants={data.tenants}
        members={data.members}
        recentLogs={data.recentLogs}
      />
    </div>
  );
}
