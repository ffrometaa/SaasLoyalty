import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { TenantDetailClient } from '@/components/admin/TenantDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface TenantRow {
  id: string;
  business_name: string;
  business_type: string | null;
  plan: string;
  plan_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
  slug: string;
  auth_user_id: string | null;
}

interface TenantMemberRow {
  id: string;
  name: string;
  email: string;
  tier: string;
  points: number;
  total_visits: number;
  last_visit_at: string | null;
  status: string;
}

interface TenantCampaignRow {
  id: string;
  name: string;
  type: string;
  status: string;
  recipient_count: number | null;
  sent_at: string | null;
  created_at: string;
}

interface TenantEventRow {
  id: string;
  action_type: string;
  target_type: string;
  created_at: string;
  super_admins: { full_name: string; email: string } | null;
}

async function getTenantDetail(tenantId: string = ''): Promise<{
  tenant: TenantRow & { owner_email: string };
  members: TenantMemberRow[];
  memberCount: number;
  campaigns: TenantCampaignRow[];
  events: TenantEventRow[];
  metrics: {
    activeMembers: number;
    visitsThisMonth: number;
    redemptions: number;
  };
} | null> {
  // Service role required: admin-only tenant detail view — bypasses RLS
  const service = createServiceRoleClient();

  const { data: tenant, error: tenantError } = await service
    .from('tenants')
    .select('id, business_name, business_type, plan, plan_status, stripe_customer_id, stripe_subscription_id, trial_ends_at, created_at, slug, auth_user_id')
    .eq('id', tenantId)
    .is('deleted_at', null)
    .single()
    .returns<TenantRow>();

  if (tenantError) console.error('[getTenantDetail] tenant query error:', tenantError);
  if (!tenant) return null;

  interface AuthWithAdmin {
    admin: {
      getUserById(uid: string): Promise<{ data: { user: { id: string; email?: string } | null }; error: Error | null }>;
    };
  }

  // Owner email
  let ownerEmail = '';
  if (tenant.auth_user_id) {
    const { data, error: authUserError } = await (service.auth as unknown as AuthWithAdmin).admin.getUserById(tenant.auth_user_id);
    if (authUserError) console.error('[getTenantDetail] getUserById error:', authUserError);
    ownerEmail = data?.user?.email ?? '';
  }

  const [
    { data: members, count: memberCount, error: membersError },
    { data: campaigns, error: campaignsError },
    { data: events, error: eventsError },
    metricData,
  ] = await Promise.all([
    service
      .from('members')
      .select('id, name, email, tier, points, total_visits, last_visit_at, status', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<TenantMemberRow[]>(),
    service
      .from('campaigns')
      .select('id, name, type, status, recipient_count, sent_at, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(30)
      .returns<TenantCampaignRow[]>(),
    service
      .from('platform_events')
      .select('id, action_type, target_type, created_at, super_admins(full_name, email)')
      .eq('target_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(30)
      .returns<TenantEventRow[]>(),
    Promise.all([
      service.from('members').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
      service.from('visits').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      service.from('redemptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ]),
  ]);

  if (membersError) console.error('[getTenantDetail] members error:', membersError);
  if (campaignsError) console.error('[getTenantDetail] campaigns error:', campaignsError);
  if (eventsError) console.error('[getTenantDetail] events error:', eventsError);

  const [
    { count: activeMembers, error: activeMembersError },
    { count: visitsThisMonth, error: visitsError },
    { count: redemptions, error: redemptionsError },
  ] = metricData;
  if (activeMembersError) console.error('[getTenantDetail] activeMembers error:', activeMembersError);
  if (visitsError) console.error('[getTenantDetail] visits error:', visitsError);
  if (redemptionsError) console.error('[getTenantDetail] redemptions error:', redemptionsError);

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

export default async function TenantDetailPage(props: { params: Promise<{ tenantId: string }> }): Promise<JSX.Element> {
  const params = await props.params;
  await verifyAdminAccess();
  const data = await getTenantDetail(params.tenantId);
  if (!data) notFound();

  return <TenantDetailClient data={data} />;
}
