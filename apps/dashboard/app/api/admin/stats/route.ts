import { NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getAuthedUser();

    if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Service role required: cross-tenant reads across all tenants and members (bypasses RLS by design)
    const admin = createServiceRoleClient();

    interface TenantRow {
      id: string; business_name: string; business_type: string | null; slug: string | null;
      plan: string | null; plan_status: string | null; stripe_customer_id: string | null;
      trial_ends_at: string | null; created_at: string;
    }

    // All tenants
    const { data: rawTenants, error: tenantsError } = await admin
      .from('tenants')
      .select('id, business_name, business_type, slug, plan, plan_status, stripe_customer_id, trial_ends_at, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    const tenants = rawTenants as TenantRow[] | null;

    if (tenantsError) throw tenantsError;

    const totalTenants = tenants?.length || 0;
    const activeTenants = tenants?.filter(t => t.plan_status === 'active').length || 0;
    const trialingTenants = tenants?.filter(t => t.plan_status === 'trialing').length || 0;
    const canceledTenants = tenants?.filter(t => t.plan_status === 'canceled').length || 0;

    // Total members across all tenants
    const { count: totalMembers, error: totalMembersError } = await admin
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (totalMembersError) throw totalMembersError;

    // Member count per tenant for recent 5
    const recentTenants = await Promise.all(
      (tenants?.slice(0, 5) || []).map(async (tenant) => {
        const { count, error: countError } = await admin
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);
        if (countError) throw countError;
        return { ...tenant, member_count: count || 0 };
      })
    );

    return NextResponse.json({
      totalTenants,
      activeTenants,
      trialingTenants,
      canceledTenants,
      totalMembers: totalMembers || 0,
      recentTenants,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
