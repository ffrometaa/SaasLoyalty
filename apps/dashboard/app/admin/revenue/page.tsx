import { verifyAdminAccess } from '@/lib/admin/guard';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { RevenueCharts } from '@/components/admin/RevenueCharts';

export const dynamic = 'force-dynamic';

function getPlanMRR(plan = '') {
  if (plan === 'starter') return 79;
  if (plan === 'pro') return 199;
  if (plan === 'scale') return 399;
  return 0;
}

async function getRevenueData() {
  const service = createServiceRoleClient();

  const { data: allTenants } = await service
    .from('tenants')
    .select('id, plan, plan_status, created_at')
    .is('deleted_at', null);

  const tenants = allTenants ?? [];
  const activeTenants = tenants.filter((t = { plan_status: '' }) => t.plan_status === 'active');
  const trialingTenants = tenants.filter((t = { plan_status: '' }) => t.plan_status === 'trialing');
  const pastDueTenants = tenants.filter((t = { plan_status: '' }) => t.plan_status === 'past_due');

  const currentMRR = activeTenants.reduce((s = 0, t = { plan: '' }) => s + getPlanMRR(t.plan), 0);
  const currentARR = currentMRR * 12;

  const arpt = activeTenants.length > 0 ? Math.round(currentMRR / activeTenants.length) : 0;

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count: canceledThisMonth } = await service
    .from('tenants')
    .select('id', { count: 'exact', head: true })
    .eq('plan_status', 'canceled')
    .gte('updated_at', startOfMonth)
    .is('deleted_at', null);

  const churnRate = (activeTenants.length + (canceledThisMonth ?? 0)) > 0
    ? ((canceledThisMonth ?? 0) / (activeTenants.length + (canceledThisMonth ?? 0)) * 100).toFixed(1)
    : '0.0';

  const newMRR = activeTenants
    .filter((t = { created_at: '' }) => t.created_at >= startOfMonth)
    .reduce((s = 0, t = { plan: '' }) => s + getPlanMRR(t.plan), 0);

  const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: atRiskTenants } = await service
    .from('tenants')
    .select('id, business_name, plan, plan_status, trial_ends_at')
    .or(`plan_status.eq.past_due,and(plan_status.eq.trialing,trial_ends_at.lte.${threeDays})`)
    .is('deleted_at', null);

  // Trial conversion rate
  const { data: trialTenants } = await service
    .from('tenants')
    .select('plan_status')
    .not('trial_ends_at', 'is', null)
    .is('deleted_at', null);

  const trialTotal = trialTenants?.length ?? 0;
  const trialConverted = trialTenants?.filter((t = { plan_status: '' }) => t.plan_status === 'active').length ?? 0;
  const trialConversionRate = trialTotal > 0
    ? ((trialConverted / trialTotal) * 100).toFixed(1)
    : null;

  // NRR from mrr_snapshots (last 2 monthly snapshots)
  const lastMonth = new Date();
  lastMonth.setDate(1);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const twoMonthsAgo = new Date(lastMonth);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1);

  const { data: snapshots } = await service
    .from('mrr_snapshots')
    .select('snapshot_date, mrr_total')
    .gte('snapshot_date', twoMonthsAgo.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: false })
    .limit(60);

  let nrr: string | null = null;
  if (snapshots && snapshots.length >= 2) {
    const latest = snapshots[0].mrr_total;
    const oldest = snapshots[snapshots.length - 1].mrr_total;
    if (oldest > 0) nrr = ((latest / oldest) * 100).toFixed(1);
  }

  // MRR growth per month (last 12 months)
  const mrrGrowth = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    const approxMRR = activeTenants
      .filter((t = { created_at: '' }) => t.created_at < monthEnd)
      .reduce((s = 0, t = { plan: '' }) => s + getPlanMRR(t.plan), 0);

    mrrGrowth.push({ month: label, mrr: approxMRR });
  }

  // Plan distribution
  const planDist = ['starter', 'pro', 'scale', 'enterprise'].map(plan => {
    const count = activeTenants.filter((t = { plan: '' }) => t.plan === plan).length;
    const mrr = count * getPlanMRR(plan);
    const pct = activeTenants.length > 0 ? ((count / activeTenants.length) * 100).toFixed(1) : '0';
    const mrrPct = currentMRR > 0 ? ((mrr / currentMRR) * 100).toFixed(1) : '0';
    return { plan, count, pct, mrr, mrrPct };
  });

  // Suppress unused vars warning
  void trialingTenants;
  void pastDueTenants;

  return {
    currentMRR,
    currentARR,
    arpt,
    churnRate,
    newMRR,
    mrrGrowth,
    planDist,
    atRiskTenants: atRiskTenants ?? [],
    trialConversionRate,
    nrr,
  };
}

function MetricCard({ title = '', value = '', sub = '' }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminRevenuePage() {
  await verifyAdminAccess();
  const data = await getRevenueData();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-slate-400 mt-1">Platform-wide financial overview</p>
      </div>

      {/* Section 1 — Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Current MRR" value={`$${data.currentMRR.toLocaleString()}`} sub="Active paying tenants" />
        <MetricCard title="Current ARR" value={`$${data.currentARR.toLocaleString()}`} sub="MRR × 12" />
        <MetricCard title="Avg Revenue / Tenant" value={`$${data.arpt}`} sub="Per active tenant" />
        <MetricCard title="Churn Rate" value={`${data.churnRate}%`} sub="This month" />
        <MetricCard title="New MRR This Month" value={`$${data.newMRR}`} sub="From new signups" />
        <MetricCard title="Trial Conversion" value={data.trialConversionRate !== null ? `${data.trialConversionRate}%` : '—'} sub="Trialed tenants now active" />
        <MetricCard title="Est. LTV" value={data.churnRate !== '0.0' ? `$${Math.round(data.arpt / (parseFloat(data.churnRate) / 100))}` : '—'} sub="ARPT / churn rate" />
        <MetricCard title="NRR (30d)" value={data.nrr !== null ? `${data.nrr}%` : 'Collecting…'} sub={data.nrr !== null ? 'Net Revenue Retention' : 'Data accrues daily'} />
        <MetricCard title="At-Risk Tenants" value={data.atRiskTenants.length} sub="Past due or trial ending" />
      </div>

      {/* Charts + tables — client */}
      <RevenueCharts
        mrrGrowth={data.mrrGrowth}
        planDist={data.planDist}
        atRiskTenants={data.atRiskTenants}
      />
    </div>
  );
}
