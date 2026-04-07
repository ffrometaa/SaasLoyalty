import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createServiceRoleClient();

  const { data: members } = await admin
    .from('members')
    .select('id, tenant_id, name, tier, points_balance')
    .eq('auth_user_id', user.id)
    .eq('status', 'active');

  if (!members?.length) return NextResponse.json({ memberships: [] });

  const tenantIds = members.map((m) => m.tenant_id);
  const { data: tenants } = await admin
    .from('tenants')
    .select('id, business_name, brand_app_name, brand_logo_url, brand_color_primary')
    .in('id', tenantIds);

  const memberships = members.map((m) => ({
    memberId: m.id,
    tenantId: m.tenant_id,
    memberName: m.name,
    tier: m.tier,
    pointsBalance: m.points_balance,
    tenant: tenants?.find((t) => t.id === m.tenant_id) ?? null,
  }));

  return NextResponse.json({ memberships });
}
