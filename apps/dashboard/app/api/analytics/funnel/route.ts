import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

const fetchFunnelData = unstable_cache(
  async (tenantId: string) => {
    const db = createServiceRoleClient();

    const [
      { count: totalMembers },
      { count: membersWithVisits },
      { data: redemptionMembers },
    ] = await Promise.all([
      db.from('members')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .is('deleted_at', null),
      db.from('members')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gt('visits_total', 0)
        .is('deleted_at', null),
      db.from('redemptions')
        .select('member_id')
        .eq('tenant_id', tenantId),
    ]);

    const uniqueRedeeming = new Set((redemptionMembers ?? []).map((r: { member_id: string }) => r.member_id)).size;

    const total = totalMembers ?? 0;
    const withVisits = membersWithVisits ?? 0;
    const withRedemptions = uniqueRedeeming;

    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

    return {
      stages: [
        { key: 'registered', count: total, pct: 100 },
        { key: 'first_visit', count: withVisits, pct: pct(withVisits) },
        { key: 'first_redemption', count: withRedemptions, pct: pct(withRedemptions) },
      ],
      dropoff: {
        registerToVisit: total > 0 ? Math.round(((total - withVisits) / total) * 100) : 0,
        visitToRedemption: withVisits > 0 ? Math.round(((withVisits - withRedemptions) / withVisits) * 100) : 0,
      },
    };
  },
  ['analytics-funnel'],
  { revalidate: 300, tags: ['analytics'] },
);

async function resolveTenantId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string): Promise<string | null> {
  const { data: owner } = await supabase
    .from('tenants')
    .select('id')
    .eq('auth_user_id', userId)
    .is('deleted_at', null)
    .single();
  if (owner?.id) return owner.id;

  const { data: staff } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('auth_user_id', userId)
    .single();
  return staff?.tenant_id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createServerSupabaseClient();
    const tenantId = await resolveTenantId(supabase, user.id);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const data = await fetchFunnelData(tenantId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Funnel API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
