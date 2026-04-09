import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { TenantsTable } from '@/components/admin/TenantsTable';

export const dynamic = 'force-dynamic';

function getPlanMRR(plan = '') {
  if (plan === 'starter') return 79;
  if (plan === 'pro') return 199;
  if (plan === 'scale') return 399;
  return 0;
}

async function getAllTenants() {
  const service = createServiceRoleClient();

  const { data: tenants } = await service
    .from('tenants')
    .select('id, business_name, business_type, slug, plan, plan_status, stripe_customer_id, trial_ends_at, created_at, auth_user_id')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (!tenants) return [];

  const enriched = await Promise.all(
    tenants.map(async (t = { id: '', auth_user_id: null, plan: '', plan_status: '' }) => {
      const { count: memberCount } = await service
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', t.id);

      // Get owner email from auth.users via auth_user_id
      let ownerEmail = '';
      if (t.auth_user_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: user } = await (service.auth as any).admin.getUserById(t.auth_user_id);
        ownerEmail = user?.user?.email ?? '';
      }

      const lastVisit = await service
        .from('visits')
        .select('created_at')
        .eq('tenant_id', t.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

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

export default async function AdminTenantsPage() {
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
