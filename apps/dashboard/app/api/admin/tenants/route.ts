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

    const { data: tenants, error } = await admin
      .from('tenants')
      .select('id, business_name, business_type, slug, plan, plan_status, stripe_customer_id, trial_ends_at, max_members, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich each tenant with member count
    const enriched = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const { count: memberCount, error: memberCountError } = await admin
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);
        if (memberCountError) throw memberCountError;
        const { count: activeMembers, error: activeMembersError } = await admin
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'active');
        if (activeMembersError) throw activeMembersError;
        return { ...tenant, member_count: memberCount || 0, active_members: activeMembers || 0 };
      })
    );

    return NextResponse.json({ tenants: enriched });
  } catch (error) {
    console.error('Admin tenants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
