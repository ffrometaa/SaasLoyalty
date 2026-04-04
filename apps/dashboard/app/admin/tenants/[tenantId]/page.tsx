import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { TenantDetailClient } from '@/components/admin/TenantDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getTenantDetail(tenantId = '') {
  const service = createServiceRoleClient();

  const { data: tenant } = await service
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .is('deleted_at', null)
    .single();

  if (!tenant) return null;

  // Owner email
  let ownerEmail = '';
  if (tenant.auth_user_id) {
    const { data } = await service.auth.admin.getUserById(tenant.auth_user_id);
    ownerEmail = data?.user?.email ?? '';
  }

  const [
    { data: members, count: memberCount },
    { data: campaigns },
    { data: events },
    metricData,
  ] = await Promise.all([
    service
      .from('members')
      .select('id, name, email, tier, points, total_visits, last_visit_at, status', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50),
    service
      .from('campaigns')
      .select('id, name, type, status, recipient_count, sent_at, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(30),
    service
      .from('platform_events')
      .select('id, action_type, target_type, created_at, super_admins(full_name, email)')
      .eq('target_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(30),
    Promise.all([
      service.from('members').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
      service.from('visits').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      service.from('redemptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ]),
  ]);

  const [{ count: activeMembers }, { count: visitsThisMonth }, { count: redemptions }] = metricData;

  return {
    tenant: { ...tenant, owner_email: ownerEmail },
    members: members ?? [],
    memberCount: memberCount ?? 0,
    campaigns: campaigns ?? [],
    events: events ?? [],
    metrics: {
      activeMembers: activeMembers ?? 0,
      visitsThisMonth: visitsThisMonth ?? 0,
      redemptions: redemptions ?? 0,
    },
  };
}

export default async function TenantDetailPage({ params = { tenantId: '' } }) {
  await verifyAdminAccess();
  const data = await getTenantDetail(params.tenantId);
  if (!data) notFound();

  return <TenantDetailClient data={data} />;
}
