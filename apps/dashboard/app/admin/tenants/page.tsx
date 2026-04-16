import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { TenantsTable } from '@/components/admin/TenantsTable';

export const dynamic = 'force-dynamic';

function getPlanMRR(plan: string = ''): number {
  if (plan === 'starter') return 79;
  if (plan === 'pro') return 199;
  if (plan === 'scale') return 399;
  return 0;
}

interface TenantBaseRow {
  id: string;
  business_name: string;
  business_type: string | null;
  slug: string | null;
  plan: string | null;
  plan_status: string | null;
  stripe_customer_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
  auth_user_id: string | null;
}

interface TenantEnriched extends TenantBaseRow {
  member_count: number;
  owner_email: string;
  last_activity_at: string | null;
  mrr: number;
}

async function getAllTenants(): Promise<TenantEnriched[]> {
  // Service role required: admin-only tenant list — bypasses RLS
  const service = createServiceRoleClient();

  const { data: tenants, error: tenantsError } = await service
    .from('tenants')
    .select('id, business_name, business_type, slug, plan, plan_status, stripe_customer_id, trial_ends_at, created_at, auth_user_id')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (tenantsError) console.error('[getAllTenants] error:', tenantsError);

  if (!tenants) return [];

  const enriched = await Promise.all(
    tenants.map(async (t: TenantBaseRow): Promise<TenantEnriched> => {
      const { count: memberCount, error: memberCountError } = await service
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', t.id);
      if (memberCountError) console.error('[getAllTenants] memberCount error:', memberCountError);

      // Get owner email from auth.users via auth_user_id
      let ownerEmail = '';
      interface AuthWithAdmin {
        admin: {
          getUserById(uid: string): Promise<{ data: { user: { id: string; email?: string } | null }; error: Error | null }>;
        };
      }
      if (t.auth_user_id) {
        const { data: user, error: userError } = await (service.auth as unknown as AuthWithAdmin).admin.getUserById(t.auth_user_id);
        if (userError) console.error('[getAllTenants] getUserById error:', userError);
        ownerEmail = user?.user?.email ?? '';
      }

      const lastVisit = await service
        .from('visits')
        .select('created_at')
        .eq('tenant_id', t.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (lastVisit.error && lastVisit.error.code !== 'PGRST116') console.error('[getAllTenants] lastVisit error:', lastVisit.error);

      return {
        ...t,
        member_count: memberCount ?? 0,
        owner_email: ownerEmail,
        last_activity_at: lastVisit.data?.created_at ?? null,
        mrr: t.plan_status === 'active' ? getPlanMRR(t.plan) : 0,
      };
    })
  );

  return enriched;
}

export default async function AdminTenantsPage(): Promise<JSX.Element> {
  await verifyAdminAccess();
  const tenants = await getAllTenants();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tenants</h1>
        <p className="text-slate-400 mt-1">{tenants.length} registered businesses</p>
      </div>
      <TenantsTable initialTenants={tenants} />
    </div>
  );
}
