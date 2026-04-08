import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { planHasFeature, type Plan } from '../../../../lib/plans/features';

async function resolveTenantId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string): Promise<string | null> {
  const { data: owner } = await supabase
    .from('tenants')
    .select('id, plan')
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

async function resolvePlan(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, tenantId: string): Promise<Plan> {
  const { data } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single();
  return ((data?.plan as Plan) ?? 'starter') as Plan;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];
  return lines.join('\r\n');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = await resolveTenantId(supabase, session.user.id);
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const plan = await resolvePlan(supabase, tenantId);
    if (!planHasFeature(plan as Plan, 'analytics_export')) {
      return NextResponse.json(
        { error: 'Analytics export requires Scale plan or above' },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') ?? 'members';

    const db = createServiceRoleClient();

    if (type === 'members') {
      const { data: members, error } = await db
        .from('members')
        .select('name, email, phone, tier, points_balance, visits_total, last_visit_at, created_at, status')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (members ?? []).map((m: { name: string | null; email: string | null; phone: string | null; tier: string | null; points_balance: number; visits_total: number; last_visit_at: string | null; created_at: string; status: string | null }) => ({
        Name: m.name ?? '',
        Email: m.email ?? '',
        Phone: m.phone ?? '',
        Tier: m.tier,
        'Points Balance': m.points_balance,
        'Total Visits': m.visits_total,
        'Last Visit': m.last_visit_at ? new Date(m.last_visit_at).toLocaleDateString() : '',
        'Joined': new Date(m.created_at).toLocaleDateString(),
        Status: m.status,
      }));

      const csv = toCSV(rows);
      const filename = `members-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (type === 'transactions') {
      const { data: transactions, error } = await db
        .from('transactions')
        .select('type, points, balance_after, description, created_at, members(name, email)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;

      const rows = (transactions ?? []).map((t: { type: string; points: number; balance_after: number | null; description: string | null; created_at: string; members: unknown }) => {
        const member = t.members as { name: string; email: string } | null;
        return {
          Date: new Date(t.created_at).toLocaleDateString(),
          Member: member?.name ?? '',
          Email: member?.email ?? '',
          Type: t.type,
          Points: t.points,
          'Balance After': t.balance_after,
          Description: t.description ?? '',
        };
      });

      const csv = toCSV(rows);
      const filename = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid export type. Use ?type=members or ?type=transactions' }, { status: 400 });
  } catch (err) {
    console.error('Export API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
