import { NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function GET() {
  try {
    const user = await getAuthedUser();

    if (!user || user.email !== process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createServiceRoleClient();

    // All tenants
    const { data: tenants, error: tenantsError } = await admin
      .from('tenants')
      .select('id, business_name, business_type, slug, plan, plan_status, stripe_customer_id, trial_ends_at, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (tenantsError) throw tenantsError;

    const totalTenants = tenants?.length || 0;
    const activeTenants = tenants?.filter((t: any) => t.plan_status === 'active').length || 0;
    const trialingTenants = tenants?.filter((t: any) => t.plan_status === 'trialing').length || 0;
    const canceledTenants = tenants?.filter((t: any) => t.plan_status === 'canceled').length || 0;

    // Total members across all tenants
    const { count: totalMembers } = await admin
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Member count per tenant for recent 5
    const recentTenants = await Promise.all(
      (tenants?.slice(0, 5) || []).map(async (tenant: any) => {
        const { count } = await admin
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);
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
