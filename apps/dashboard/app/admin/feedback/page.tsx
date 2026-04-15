import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { FeedbackTable, type FeedbackRow } from '@/components/admin/FeedbackTable';

export const dynamic = 'force-dynamic';

// Minimal shape we need from the Supabase auth admin API
interface AdminUserResult {
  data: { user: { email?: string } | null };
  error: { message: string } | null;
}
interface AuthAdminApi {
  getUserById(uid: string): Promise<AdminUserResult>;
}
interface ServiceAuthWithAdmin {
  admin: AuthAdminApi;
}

async function getFeedback(): Promise<FeedbackRow[]> {
  // Service role required: reads feedback_submissions cross-tenant and resolves auth.users emails
  const service = createServiceRoleClient();

  const { data: rows, error: rowsError } = await service
    .from('feedback_submissions')
    .select('id, source, type, message, status, created_at, tenant_id, auth_user_id')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (rowsError) throw new Error(`feedback_submissions query failed: ${rowsError.message}`);
  if (!rows || rows.length === 0) return [];

  // Resolve tenant names
  const tenantIds = Array.from(new Set(rows.map(r => r.tenant_id).filter((x): x is string => x != null)));
  const tenantMap: Record<string, string> = {};
  if (tenantIds.length > 0) {
    const { data: tenants, error: tenantsError } = await service
      .from('tenants')
      .select('id, business_name')
      .in('id', tenantIds);
    if (tenantsError) throw new Error(`tenants query failed: ${tenantsError.message}`);
    for (const t of tenants ?? []) {
      tenantMap[t.id] = t.business_name;
    }
  }

  // Resolve user emails via admin API
  const userIds = Array.from(new Set(rows.map(r => r.auth_user_id).filter((x): x is string => x != null)));
  const emailMap: Record<string, string> = {};
  const authAdmin = (service.auth as unknown as ServiceAuthWithAdmin).admin;
  for (const uid of userIds) {
    const { data, error: userError } = await authAdmin.getUserById(uid);
    if (userError) throw new Error(`getUserById failed for ${uid}: ${userError.message}`);
    if (data?.user?.email) emailMap[uid] = data.user.email;
  }

  return rows.map(r => ({
    id: r.id,
    source: r.source as 'tenant' | 'member',
    type: r.type as 'bug' | 'feature' | 'suggestion' | 'general',
    message: r.message,
    status: r.status as 'new' | 'read' | 'resolved',
    created_at: r.created_at,
    tenant_name: r.tenant_id ? (tenantMap[r.tenant_id] ?? null) : null,
    user_email: r.auth_user_id ? (emailMap[r.auth_user_id] ?? null) : null,
  }));
}

export default async function AdminFeedbackPage(): Promise<JSX.Element> {
  await verifyAdminAccess();
  const rows = await getFeedback();

  const newCount = rows.filter(r => r.status === 'new').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <p className="text-slate-400 mt-1">
          {rows.length} total submissions
          {newCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300">
              {newCount} new
            </span>
          )}
        </p>
      </div>
      <FeedbackTable initialRows={rows} />
    </div>
  );
}
