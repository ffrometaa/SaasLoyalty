import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { ImpersonatePanel } from '@/components/admin/ImpersonatePanel';

export const dynamic = 'force-dynamic';

interface RawMemberRow {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  tier: string;
  points_balance: number;
  status: string;
  tenants: { business_name: string } | null;
}

interface RawLogRow {
  id: string;
  impersonation_level: string;
  started_at: string;
  ended_at: string | null;
  reason: string | null;
  target_member_id: string | null;
  target_tenant_id: string | null;
  super_admins: { full_name: string; email: string } | null;
}

async function getImpersonateData(): Promise<{
  tenants: Array<{ id: string; business_name: string; slug: string; plan: string; plan_status: string; auth_user_id: string; created_at: string }>;
  members: Array<{ id: string; tenant_id: string; tenant_name: string; email: string; name: string; tier: string; points_balance: number; status: string }>;
  recentLogs: Array<{ id: string; impersonation_level: string; started_at: string; ended_at: string | null; reason: string | null; target_member_id: string | null; target_tenant_id: string | null; admin_name: string; admin_email: string }>;
}> {
  // Service role required: cross-tenant reads across tenants, members, and impersonation_logs (bypasses RLS by design)
  const service = createServiceRoleClient();

  const [
    { data: tenants, error: tenantsError },
    { data: members, error: membersError },
    { data: recentLogs, error: logsError },
  ] = await Promise.all([
    service
      .from('tenants')
      .select('id, business_name, slug, plan, plan_status, auth_user_id, created_at')
      .is('deleted_at', null)
      .not('auth_user_id', 'is', null)
      .order('business_name', { ascending: true })
      .limit(200)
      .returns<Array<{ id: string; business_name: string; slug: string; plan: string; plan_status: string; auth_user_id: string; created_at: string }>>(),

    service
      .from('members')
      .select('id, tenant_id, email, name, tier, points_balance, status, tenants:tenant_id(business_name)')
      .eq('status', 'active')
      .order('name', { ascending: true })
      .limit(200)
      .returns<RawMemberRow[]>(),

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
      .limit(50)
      .returns<RawLogRow[]>(),
  ]);

  if (tenantsError) throw new Error(`tenants query failed: ${tenantsError.message}`);
  if (membersError) throw new Error(`members query failed: ${membersError.message}`);
  if (logsError) throw new Error(`impersonation_logs query failed: ${logsError.message}`);

  return {
    tenants: tenants ?? [],
    members: (members ?? []).map((m: RawMemberRow) => ({
      id: m.id,
      tenant_id: m.tenant_id,
      tenant_name: m.tenants?.business_name ?? 'Unknown',
      email: m.email,
      name: m.name,
      tier: m.tier,
      points_balance: m.points_balance,
      status: m.status,
    })),
    recentLogs: (recentLogs ?? []).map((l: RawLogRow) => ({
      id: l.id,
      impersonation_level: l.impersonation_level,
      started_at: l.started_at,
      ended_at: l.ended_at,
      reason: l.reason,
      target_member_id: l.target_member_id,
      target_tenant_id: l.target_tenant_id,
      admin_name: l.super_admins?.full_name ?? '',
      admin_email: l.super_admins?.email ?? '',
    })),
  };
}

export default async function ImpersonatePage(): Promise<JSX.Element> {
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
