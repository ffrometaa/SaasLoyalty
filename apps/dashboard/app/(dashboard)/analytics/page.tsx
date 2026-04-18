'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users, TrendingUp, TrendingDown, Minus, Calendar, Gift,
  Percent, Clock, Download, BarChart2, Filter, Target, DollarSign,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FeatureGate } from '../../../components/dashboard/FeatureGate';
import { TrialBanner } from '../../../components/dashboard/TrialBanner';
import { SectionErrorBoundary } from '../../../components/SectionErrorBoundary';
import { DateRangePicker } from '../../../components/analytics/DateRangePicker';
import { NewMembersLineChart } from '../../../components/analytics/NewMembersLineChart';
import { TierDistributionPieChart } from '../../../components/analytics/TierDistributionPieChart';
import { MemberSegmentsBarChart } from '../../../components/analytics/MemberSegmentsBarChart';
import { PointsTimelineBarChart } from '../../../components/analytics/PointsTimelineBarChart';
import type { Plan } from '../../../lib/plans/features';

// ── Types ────────────────────────────────────────────────────────────────────

type Segments = {
  frequent: number; regular: number; occasional: number;
  atRisk: number; inactive: number;
};

type AnalyticsData = {
  metrics: {
    activeMembers: number; visitsThisMonth: number;
    pointsRedeemedThisMonth: number; retentionRate: number;
    changes: {
      activeMembers: number; visitsThisMonth: number;
      pointsRedeemedThisMonth: number; retentionRate: number;
      revenue: number;
    };
  };
  segments: Segments;
  heatmap: number[][];
  topRewards: { name: string; count: number }[];
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_change: number;
  points_liability: number;
  new_members_monthly: { month: string; count: number }[];
  tier_distribution: { tier: string; count: number }[];
};

type CohortRow = { monthKey: string; month: string; size: number; retention: (number | null)[] };
type CohortData = { cohorts: CohortRow[]; columnLabels: string[] };

type FunnelStage = { key: string; count: number; pct: number };
type FunnelData = { stages: FunnelStage[]; dropoff: { registerToVisit: number; visitToRedemption: number } };

type CampaignRow = {
  id: string; name: string; type: string; status: string;
  bonusPoints: number; bonusMultiplier: number;
  stats: { sent: number; delivered: number; opened: number; clicked: number };
  startedAt: string | null; completedAt: string | null;
};
type WeekPoint = { label: string; earned: number; redeemed: number };
type CampaignsData = { campaigns: CampaignRow[]; pointsTimeline: WeekPoint[] };

type Tab = 'overview' | 'cohorts' | 'funnel' | 'campaigns';

// ── Sub-components ────────────────────────────────────────────────────────────

function ChangeIndicator({ change, label }: { change: number; label?: string }) {
  if (change > 0)
    return <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600"><TrendingUp className="h-4 w-4" />+{change}%{label ? ` ${label}` : ''}</span>;
  if (change < 0)
    return <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600"><TrendingDown className="h-4 w-4" />{change}%{label ? ` ${label}` : ''}</span>;
  return <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500"><Minus className="h-4 w-4" />0%{label ? ` ${label}` : ''}</span>;
}

function RetentionCell({ value }: { value: number | null }) {
  if (value === null) return <td className="px-3 py-2 text-center text-gray-300 text-xs">—</td>;
  const bg = value >= 70 ? 'bg-green-100 text-green-800'
    : value >= 40 ? 'bg-yellow-100 text-yellow-800'
    : value > 0 ? 'bg-red-100 text-red-700'
    : 'bg-gray-100 text-gray-500';
  return (
    <td className={`px-3 py-2 text-center text-xs font-semibold rounded ${bg}`}>
      {value}%
    </td>
  );
}

function FunnelBar({ stage, maxCount }: { stage: FunnelStage; count?: number; maxCount: number }) {
  const labels: Record<string, string> = {
    registered: 'Signed Up',
    first_visit: 'First Visit',
    first_redemption: 'First Redemption',
  };
  const colors: Record<string, string> = {
    registered: 'bg-brand-purple',
    first_visit: 'bg-blue-500',
    first_redemption: 'bg-green-500',
  };
  const barWidth = maxCount > 0 ? Math.round((stage.count / maxCount) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{labels[stage.key] ?? stage.key}</span>
        <span className="text-gray-500">{stage.count.toLocaleString()} ({stage.pct}%)</span>
      </div>
      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
        <div
          className={`h-full ${colors[stage.key] ?? 'bg-gray-400'} rounded-lg transition-all`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-100 text-blue-700',
    draft: 'bg-yellow-100 text-yellow-700',
    paused: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();

  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [plan, setPlan] = useState<Plan>('starter');
  // undefined = loading, null = never used, object = trial exists (active or expired)
  const [heatmapTrial, setHeatmapTrial] = useState<{ status: string; trial_end: string } | null | undefined>(undefined);
  const [exportType, setExportType] = useState<'members' | 'transactions'>('members');
  const [exporting, setExporting] = useState(false);

  // Overview state
  const [data, setData] = useState<AnalyticsData | null>(null);

  // Advanced tabs state
  const [cohortData, setCohortData] = useState<CohortData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [campaignsData, setCampaignsData] = useState<CampaignsData | null>(null);

  useEffect(() => {
    const dateQuery = from ? `?from=${from}&to=${to}` : '';
    fetch(`/api/analytics${dateQuery}`).then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); });
    fetch('/api/settings').then(r => r.ok ? r.json() : null).then(d => { if (d?.plan) setPlan(d.plan as Plan); });
    fetch('/api/feature-trials')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const tr = (d?.trials ?? []).find((tr: { feature_name: string }) => tr.feature_name === 'heatmap');
        setHeatmapTrial(tr ?? null);
      });
  }, [from, to]);

  const loadCohorts = useCallback(() => {
    if (cohortData) return;
    fetch('/api/analytics/cohort').then(r => r.ok ? r.json() : null).then(d => { if (d) setCohortData(d); });
  }, [cohortData]);

  const loadFunnel = useCallback(() => {
    if (funnelData) return;
    fetch('/api/analytics/funnel').then(r => r.ok ? r.json() : null).then(d => { if (d) setFunnelData(d); });
  }, [funnelData]);

  const loadCampaigns = useCallback(() => {
    if (campaignsData) return;
    const dateQuery = from ? `?from=${from}&to=${to}` : '';
    fetch(`/api/analytics/campaigns${dateQuery}`).then(r => r.ok ? r.json() : null).then(d => { if (d) setCampaignsData(d); });
  }, [campaignsData, from, to]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'cohorts') loadCohorts();
    if (tab === 'funnel') loadFunnel();
    if (tab === 'campaigns') loadCampaigns();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/analytics/export?type=${exportType}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // Overview derived values
  const segments = data?.segments;
  const segmentTotal = segments
    ? segments.frequent + segments.regular + segments.occasional + segments.atRisk + segments.inactive
    : 0;
  const pct = (n: number) => segmentTotal ? Math.round((n / segmentTotal) * 100) : 0;
  const memberSegments = segments ? [
    { name: t('segmentFrequent'), count: segments.frequent, percentage: pct(segments.frequent), color: 'bg-green-500' },
    { name: t('segmentRegular'), count: segments.regular, percentage: pct(segments.regular), color: 'bg-blue-500' },
    { name: t('segmentOccasional'), count: segments.occasional, percentage: pct(segments.occasional), color: 'bg-yellow-500' },
    { name: t('segmentAtRisk'), count: segments.atRisk, percentage: pct(segments.atRisk), color: 'bg-orange-500' },
    { name: t('segmentInactive'), count: segments.inactive, percentage: pct(segments.inactive), color: 'bg-red-500' },
  ] : [];

  const hours = Array.from({ length: 12 }, (_, i) => i + 9);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const rawHeatmap = data?.heatmap ?? null;
  let heatmapData: number[][] | null = null;
  if (rawHeatmap) {
    const maxVal = Math.max(1, ...rawHeatmap.flatMap(row => hours.map(h => row[h])));
    heatmapData = days.map((_, dayIndex) =>
      hours.map(hour => Math.round((rawHeatmap[dayIndex][hour] / maxVal) * 100))
    );
  }

  const metrics = data?.metrics;
  const topRewards = data?.topRewards ?? [];

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t('tabOverview'), icon: BarChart2 },
    { id: 'cohorts', label: t('tabCohorts'), icon: Users },
    { id: 'funnel', label: t('tabFunnel'), icon: Filter },
    { id: 'campaigns', label: t('tabCampaigns'), icon: Target },
  ];

  return (
    <SectionErrorBoundary section="Analytics">
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker />
          <FeatureGate plan={plan} feature="analytics_export" silent>
            <div className="flex items-center gap-2">
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as 'members' | 'transactions')}
                className="text-sm border rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              >
                <option value="members">Members CSV</option>
                <option value="transactions">Transactions CSV</option>
              </select>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:bg-gray-50 text-gray-600 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting…' : tCommon('export')}
              </button>
            </div>
          </FeatureGate>
        </div>
      </div>

      {heatmapTrial?.status === 'active' && (
        <TrialBanner feature="heatmap" trialEnd={heatmapTrial.trial_end} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* KPI cards — row 1 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[
              { label: t('activeMembers'), icon: Users, value: metrics?.activeMembers, change: metrics?.changes.activeMembers ?? 0, sub: t('thisMonth') },
              { label: t('visits'), icon: Calendar, value: metrics?.visitsThisMonth?.toLocaleString(), change: metrics?.changes.visitsThisMonth ?? 0, sub: t('thisMonth') },
              { label: t('pointsRedeemed'), icon: Gift, value: metrics?.pointsRedeemedThisMonth?.toLocaleString(), change: metrics?.changes.pointsRedeemedThisMonth ?? 0, sub: t('thisMonth') },
              { label: t('retentionRate'), icon: Percent, value: metrics ? `${metrics.retentionRate}%` : undefined, change: metrics?.changes.retentionRate ?? 0, sub: t('activeTotalMembers') },
            ].map(({ label, icon: Icon, value, change, sub }) => (
              <div key={label} className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{label}</span>
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">{value ?? '—'}</span>
                  {metrics && <ChangeIndicator change={change} />}
                </div>
                <p className="text-sm text-gray-500 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* KPI cards — row 2: Revenue + Points Liability */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Revenue Impact */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Revenue Impact</p>
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data?.revenue_this_month != null
                  ? `$${data.revenue_this_month.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                  : '—'}
              </p>
              {data?.metrics?.changes?.revenue != null && (
                <ChangeIndicator change={data.metrics.changes.revenue} label="vs last period" />
              )}
            </div>

            {/* Points Liability */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Points Liability</p>
                <Gift className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data?.points_liability != null ? data.points_liability.toLocaleString() : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Outstanding balance</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Member Segments — Recharts bar chart */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('memberSegments')}</h2>
              {memberSegments.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
              ) : (
                <MemberSegmentsBarChart data={memberSegments} />
              )}
              {segments && segments.atRisk > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">{t('atRiskCount', { count: segments.atRisk })}</p>
                      <p className="text-sm text-amber-700">{t('atRiskDesc')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Visits Heatmap — gated by plan or active trial */}
            <FeatureGate
              plan={plan}
              feature="analytics_heatmap"
              bypass={heatmapTrial?.status === 'active'}
              trialHref={heatmapTrial === null
                ? `mailto:hello@loyalbase.dev?subject=${encodeURIComponent('45-day Heatmap Trial Request')}&body=${encodeURIComponent("Hi, I'm interested in trying the Heatmap Analytics feature for 45 days.")}`
                : undefined}
            >
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('peakHours')}</h2>
                {heatmapData === null ? (
                  <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      <div className="flex mb-2">
                        <div className="w-12" />
                        {hours.map((hour) => (
                          <div key={hour} className="flex-1 text-center text-xs text-gray-500">{hour}:00</div>
                        ))}
                      </div>
                      {days.map((day, dayIndex) => (
                        <div key={day} className="flex items-center mb-1">
                          <div className="w-12 text-sm text-gray-600">{day}</div>
                          {heatmapData![dayIndex].map((intensity, hourIndex) => (
                            <div
                              key={hourIndex}
                              className="flex-1 h-6 rounded-sm mx-0.5"
                              style={{ backgroundColor: `rgba(99, 102, 241, ${intensity / 100})` }}
                              title={`${intensity}% of peak visits`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-4 text-center">{t('darkerColorsNote')}</p>
              </div>
            </FeatureGate>

            {/* Top Rewards */}
            <div className="bg-white rounded-xl border p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('popularServices')}</h2>
              {topRewards.length === 0 && data !== null ? (
                <div className="py-8 text-center text-gray-400 text-sm">No redemptions yet.</div>
              ) : topRewards.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('service')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Redemptions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRewards.map((reward, index) => (
                        <tr key={reward.name} className="border-b last:border-0">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple-100 text-brand-purple font-bold text-sm">{index + 1}</span>
                              <span className="font-medium text-gray-900">{reward.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right text-gray-600">{reward.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* New Members + Tier Distribution charts */}
          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">New Members (12 months)</h3>
              <NewMembersLineChart data={data?.new_members_monthly ?? []} />
            </div>
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Tier Distribution</h3>
              <TierDistributionPieChart data={data?.tier_distribution ?? []} />
            </div>
          </div>
        </>
      )}

      {/* ── COHORTS TAB ──────────────────────────────────────────── */}
      {activeTab === 'cohorts' && (
        <FeatureGate plan={plan} feature="analytics_full">
          <div className="bg-white rounded-xl border p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('cohortTitle')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('cohortDesc')}</p>
            </div>
            {!cohortData ? (
              <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">{t('cohortMonth')}</th>
                      <th className="text-center py-3 px-3 text-gray-500 font-medium whitespace-nowrap">{t('cohortSize')}</th>
                      {cohortData.columnLabels.map((label) => (
                        <th key={label} className="text-center py-3 px-3 text-gray-500 font-medium whitespace-nowrap">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.cohorts.map((row) => (
                      <tr key={row.monthKey} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium text-gray-800 whitespace-nowrap">{row.month}</td>
                        <td className="py-3 px-3 text-center text-gray-600">{row.size}</td>
                        {cohortData.columnLabels.map((_, colIndex) => (
                          <RetentionCell key={colIndex} value={row.retention[colIndex] ?? null} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span>{t('cohortLegend')}</span>
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> ≥70%</span>
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" /> 40–69%</span>
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> &lt;40%</span>
                </div>
              </div>
            )}
          </div>
        </FeatureGate>
      )}

      {/* ── FUNNEL TAB ───────────────────────────────────────────── */}
      {activeTab === 'funnel' && (
        <FeatureGate plan={plan} feature="analytics_full">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-xl border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{t('funnelTitle')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('funnelDesc')}</p>
              </div>
              {!funnelData ? (
                <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
              ) : (
                <div className="space-y-5">
                  {funnelData.stages.map((stage) => (
                    <FunnelBar
                      key={stage.key}
                      stage={stage}
                      maxCount={funnelData.stages[0].count}
                    />
                  ))}
                </div>
              )}
            </div>

            {funnelData && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('funnelDropoff')}</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-sm text-orange-700 font-medium">{t('funnelDropSignup')}</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">{funnelData.dropoff.registerToVisit}%</p>
                    <p className="text-xs text-orange-600 mt-0.5">{t('funnelDropSignupHint')}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-700 font-medium">{t('funnelDropVisit')}</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{funnelData.dropoff.visitToRedemption}%</p>
                    <p className="text-xs text-blue-600 mt-0.5">{t('funnelDropVisitHint')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </FeatureGate>
      )}

      {/* ── CAMPAIGNS TAB ────────────────────────────────────────── */}
      {activeTab === 'campaigns' && (
        <FeatureGate plan={plan} feature="analytics_full">
          <div className="space-y-6">
            {/* Points Timeline Chart — Recharts */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('pointsTimeline')}</h2>
              <p className="text-sm text-gray-500 mb-6">{t('pointsTimelineDesc')}</p>
              {!campaignsData ? (
                <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
              ) : (
                <PointsTimelineBarChart data={campaignsData.pointsTimeline} />
              )}
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('campaignPerformance')}</h2>
              {!campaignsData ? (
                <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
              ) : campaignsData.campaigns.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  No campaigns yet. Create your first campaign to see performance data.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Campaign</th>
                        <th className="text-center py-3 px-3 text-gray-500 font-medium">Status</th>
                        <th className="text-right py-3 px-3 text-gray-500 font-medium">Sent</th>
                        <th className="text-right py-3 px-3 text-gray-500 font-medium">Delivered</th>
                        <th className="text-right py-3 px-3 text-gray-500 font-medium">Opened</th>
                        <th className="text-right py-3 px-3 text-gray-500 font-medium">Clicked</th>
                        <th className="text-right py-3 px-3 text-gray-500 font-medium">Bonus pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignsData.campaigns.map((c) => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <p className="font-medium text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{c.type}</p>
                          </td>
                          <td className="py-3 px-3 text-center"><StatusBadge status={c.status} /></td>
                          <td className="py-3 px-3 text-right text-gray-600">{(c.stats?.sent ?? 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-gray-600">{(c.stats?.delivered ?? 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-gray-600">{(c.stats?.opened ?? 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-gray-600">{(c.stats?.clicked ?? 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right">
                            {c.bonusMultiplier > 1
                              ? <span className="font-medium text-brand-purple">{c.bonusMultiplier}×</span>
                              : <span className="font-medium text-brand-purple">{c.bonusPoints}</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </FeatureGate>
      )}
    </div>
    </SectionErrorBoundary>
  );
}
