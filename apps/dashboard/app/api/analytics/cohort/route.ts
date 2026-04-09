import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

const fetchCohortData = unstable_cache(
  async (tenantId: string) => {
    const db = createServiceRoleClient();
    const now = new Date();

    // Fetch members from last 7 months (so cohort 0 has full data)
    const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const { data: members, error } = await db
      .from('members')
      .select('id, created_at, last_visit_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', sevenMonthsAgo.toISOString())
      .is('deleted_at', null);

    if (error) throw error;

    // Build cohort map: { '2024-11': { size, members[] } }
    const cohortMap: Record<string, { size: number; members: { last_visit_at: string | null }[] }> = {};
    for (const m of members ?? []) {
      const d = new Date(m.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!cohortMap[key]) cohortMap[key] = { size: 0, members: [] };
      cohortMap[key].size++;
      cohortMap[key].members.push({ last_visit_at: m.last_visit_at });
    }

    // Last 6 cohort months (oldest → newest)
    const cohortMonthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      cohortMonthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Column headers (month labels) — up to 6 months ahead from each cohort
    const maxCols = 6;
    const columnLabels = Array.from({ length: maxCols }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (maxCols - 1 - i), 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });

    // Build cohort rows
    const cohorts = cohortMonthKeys.map((cohortKey) => {
      const cohort = cohortMap[cohortKey];
      const [year, month] = cohortKey.split('-').map(Number);
      const cohortLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
        month: 'short', year: '2-digit',
      });

      if (!cohort || cohort.size === 0) {
        return { monthKey: cohortKey, month: cohortLabel, size: 0, retention: [] };
      }

      // Months from this cohort to now
      const monthsSince = (now.getFullYear() - year) * 12 + (now.getMonth() - (month - 1));
      const retention: (number | null)[] = [];

      for (let delta = 0; delta <= Math.min(monthsSince, maxCols - 1); delta++) {
        if (delta === 0) {
          retention.push(100);
        } else {
          // Retained = last_visit_at >= start of cohort_month + delta
          const periodStart = new Date(year, month - 1 + delta, 1);
          const retained = cohort.members.filter(
            (mem) => mem.last_visit_at && new Date(mem.last_visit_at) >= periodStart,
          ).length;
          retention.push(Math.round((retained / cohort.size) * 100));
        }
      }

      // Pad future months with null
      while (retention.length < maxCols) retention.push(null);

      return { monthKey: cohortKey, month: cohortLabel, size: cohort.size, retention };
    });

    return { cohorts, columnLabels };
  },
  ['analytics-cohort'],
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

    const data = await fetchCohortData(tenantId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Cohort API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
