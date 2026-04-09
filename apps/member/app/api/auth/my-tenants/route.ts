import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Prefer Bearer token (avoids cookie race condition after signInWithPassword).
  // Fall back to cookie-based session for normal navigation.
  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let user: { id: string } | null = null;

  if (accessToken) {
    const admin = createServiceRoleClient();
    const { data } = await admin.auth.getUser(accessToken);
    user = data?.user ?? null;
  } else {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { user: cookieUser } } = await (supabase.auth as any).getUser();
    user = cookieUser;
  }

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createServiceRoleClient();

  type MemberRow = { id: string; tenant_id: string; name: string; tier: string; points_balance: number };
  type TenantRow = { id: string; business_name: string; brand_app_name: string | null; brand_logo_url: string | null; brand_color_primary: string | null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membersRaw } = await (admin as any)
    .from('members')
    .select('id, tenant_id, name, tier, points_balance')
    .eq('auth_user_id', user.id)
    .eq('status', 'active');

  const members: MemberRow[] = membersRaw ?? [];
  if (!members.length) return NextResponse.json({ memberships: [] });

  const tenantIds = members.map((m) => m.tenant_id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenantsRaw } = await (admin as any)
    .from('tenants')
    .select('id, business_name, brand_app_name, brand_logo_url, brand_color_primary')
    .in('id', tenantIds);

  const tenants: TenantRow[] = tenantsRaw ?? [];

  const memberships = members.map((m) => ({
    memberId: m.id,
    tenantId: m.tenant_id,
    memberName: m.name,
    tier: m.tier,
    pointsBalance: m.points_balance,
    tenant: tenants.find((t) => t.id === m.tenant_id) ?? null,
  }));

  return NextResponse.json({ memberships });
}
