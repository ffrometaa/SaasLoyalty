import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Prefer Bearer token (avoids cookie race condition after signInWithPassword).
  // Fall back to cookie-based session for normal navigation.
  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let user: { id: string } | null = null;

  if (accessToken) {
    // Service role required: cross-tenant member lookup — bypasses RLS
    const admin = createServiceRoleClient();
    const { data, error: getTokenError } = await (admin.auth as unknown as { getUser(token: string): Promise<{ data: { user: { id: string } | null }; error: Error | null }> }).getUser(accessToken);
    if (getTokenError) console.error('[my-tenants] getUser(token) error:', getTokenError);
    user = data?.user ?? null;
  } else {
    const supabase = await createServerSupabaseClient();
    const { data: { user: cookieUser }, error: cookieAuthError } = await supabase.auth.getUser();
    if (cookieAuthError) console.error('[my-tenants] getUser(cookie) error:', cookieAuthError);
    user = cookieUser;
  }

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Service role required: cross-tenant member lookup — bypasses RLS
  const admin = createServiceRoleClient();

  type MemberRow = { id: string; tenant_id: string; name: string; tier: string; points_balance: number };
  type TenantRow = { id: string; business_name: string; brand_app_name: string | null; brand_logo_url: string | null; brand_color_primary: string | null };

  const { data: membersRaw, error: membersError } = await admin
    .from('members')
    .select('id, tenant_id, name, tier, points_balance')
    .eq('auth_user_id', user.id)
    .eq('status', 'active');
  if (membersError) {
    console.error('[my-tenants] members query error:', membersError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const members: MemberRow[] = membersRaw ?? [];
  if (!members.length) return NextResponse.json({ memberships: [] });

  const tenantIds = members.map((m) => m.tenant_id);
  const { data: tenantsRaw, error: tenantsError } = await admin
    .from('tenants')
    .select('id, business_name, brand_app_name, brand_logo_url, brand_color_primary')
    .in('id', tenantIds);
  if (tenantsError) {
    console.error('[my-tenants] tenants query error:', tenantsError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

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
