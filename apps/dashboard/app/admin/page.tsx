import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { AdminCharts } from '@/components/admin/AdminCharts';

export const dynamic = 'force-dynamic';

interface TenantSummaryRow {
  id: string;
  business_name: string;
  plan: string;
  plan_status: string;
  created_at: string;
}

interface TenantGrowthRow {
  created_at: string;
}

interface PlatformEventRow {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  created_at: string;
  super_admins: { full_name: string; email: string } | null;
}

function getPlanMRR(plan = '') {
  if (plan === 'starter') return 79;
  if (plan === 'pro') return 199;
  if (plan === 'scale') return 399;
  return 0;
}

async function getPlatformStats() {
  const service = createServiceRoleClient();

  const [
    { data: tenants },
    { count: totalMembers },
    { count: campaignsThisMonth },
    { count: redemptionsThisMonth },
    { data: recentEvents },
    { data: tenantGrowth },
  ] = await Promise.all([
    service
      .from('tenants')
      .select('id, business_name, plan, plan_status, created_at')
      .is('deleted_at', null)
      .returns<TenantSummaryRow[]>(),
    service
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    service
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    service
      .from('redemptions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    service
      .from('platform_events')
      .select('id, action_type, target_type, target_id, created_at, super_admins(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<PlatformEventRow[]>(),
    service
      .from('tenants')
      .select('created_at')
      .is('deleted_at', null)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
      .returns<TenantGrowthRow[]>(),
  ]);

  const allTenants = tenants ?? [];
  const activeTenants = allTenants.filter((t: TenantSummaryRow) => t.plan_status === 'active').length;
  const trialingTenants = allTenants.filter((t: TenantSummaryRow) => t.plan_status === 'trialing').length;

  const totalMRR = allTenants
    .filter((t: TenantSummaryRow) => t.plan_status === 'active')
    .reduce((sum: number, t: TenantSummaryRow) => sum + getPlanMRR(t.plan), 0);

  // MRR by plan
  const mrrByPlan = Object.fromEntries(
    ['starter', 'pro', 'scale'].map(plan => {
      const count = allTenants.filter((t: TenantSummaryRow) => t.plan_status === 'active' && t.plan === plan).length;
      return [plan, count * getPlanMRR(plan)];
    })
  );

  // Tenant growth per month (last 12 months)
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const count = (tenantGrowth ?? []).filter((t: TenantGrowthRow) => {
      const created = new Date(t.created_at);
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
    }).length;
    months.push({ month: label, count });
  }

  return {
    totalTenants: allTenants.length,
    activeTenants,
    trialingTenants,
    totalMembers: totalMembers ?? 0,
    totalMRR,
    totalARR: totalMRR * 12,
    campaignsThisMonth: campaignsThisMonth ?? 0,
    redemptionsThisMonth: redemptionsThisMonth ?? 0,
    mrrByPlan,
    tenantGrowth: months,
    recentEvents: recentEvents ?? [],
  };
}

function MetricCard({ title = '', value = '', sub = '', accent = false }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? 'bg-[#7c3aed]/10 border-[#7c3aed]/30' : 'bg-white/[0.03] border-white/[0.08]'}`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-[#a78bfa]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function formatCurrency(n = 0) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

export default async function AdminOverviewPage() {
  await verifyAdminAccess();
  const stats = await getPlatformStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 mt-1">LoyaltyOS platform health and activity</p>
      </div>

      {/* Row 1 — Platform health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard title="Total Tenants" value={stats.totalTenants} sub="All registered businesses" />
        <MetricCard title="Active Tenants" value={stats.activeTenants} sub="Paying subscribers" />
        <MetricCard title="Trialing" value={stats.trialingTenants} sub="Free trial" />
        <MetricCard title="Total Members" value={stats.totalMembers.toLocaleString()} sub="Across all tenants" />
      </div>

      {/* Row 2 — Revenue and activity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Monthly MRR" value={formatCurrency(stats.totalMRR)} sub="Active tenants" accent />
        <MetricCard title="Annual ARR" value={formatCurrency(stats.totalARR)} sub="MRR × 12" accent />
        <MetricCard title="Campaigns This Month" value={stats.campaignsThisMonth.toLocaleString()} sub="Across all tenants" />
        <MetricCard title="Redemptions This Month" value={stats.redemptionsThisMonth.toLocaleString()} sub="Across all tenants" />
      </div>

      {/* Charts — client component */}
      <AdminCharts
        mrrByPlan={stats.mrrByPlan}
        tenantGrowth={stats.tenantGrowth}
        recentEvents={stats.recentEvents}
      />
    </div>
  );
}
