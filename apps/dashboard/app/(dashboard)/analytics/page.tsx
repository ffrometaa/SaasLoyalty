'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Minus, Calendar, Gift, Percent, Clock, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FeatureGate } from '../../../components/dashboard/FeatureGate';
import type { Plan } from '../../../lib/plans/features';

type Segments = {
  frequent: number;
  regular: number;
  occasional: number;
  atRisk: number;
  inactive: number;
};

type AnalyticsData = {
  metrics: {
    activeMembers: number;
    visitsThisMonth: number;
    pointsRedeemedThisMonth: number;
    retentionRate: number;
    changes: {
      activeMembers: number;
      visitsThisMonth: number;
      pointsRedeemedThisMonth: number;
      retentionRate: number;
    };
  };
  segments: Segments;
  heatmap: number[][];
  topRewards: { name: string; count: number }[];
};

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const tCommon = useTranslations('common');

  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [plan, setPlan] = useState<Plan>('starter');

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); });

    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.plan) setPlan(d.plan as Plan); });
  }, []);

  const rangeLabel: Record<'week' | 'month' | 'year', string> = {
    week: t('week'),
    month: t('month'),
    year: t('year'),
  };

  const ChangeIndicator = ({ change }: { change: number }) => {
    if (change > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
          <TrendingUp className="h-4 w-4" />
          +{change}%
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
          <TrendingDown className="h-4 w-4" />
          {change}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
        <Minus className="h-4 w-4" />
        0%
      </span>
    );
  };

  // Build member segments from real data
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

  // Build heatmap: slice hours 9-20 (indices 9..20 inclusive = 12 cols)
  const hours = Array.from({ length: 12 }, (_, i) => i + 9);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const rawHeatmap = data?.heatmap ?? null;
  // Normalize to 0-100 for display
  let heatmapData: number[][] | null = null;
  if (rawHeatmap) {
    const maxVal = Math.max(1, ...rawHeatmap.flatMap(row => hours.map(h => row[h])));
    heatmapData = days.map((_, dayIndex) =>
      hours.map(hour => Math.round((rawHeatmap[dayIndex][hour] / maxVal) * 100))
    );
  }

  const metrics = data?.metrics;
  const topRewards = data?.topRewards ?? [];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dateRange === range
                  ? 'bg-brand-purple text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {rangeLabel[range]}
            </button>
          ))}
          <FeatureGate plan={plan} feature="analytics_export" silent>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:bg-gray-50 text-gray-600">
              <Download className="h-4 w-4" />
              {tCommon('export')}
            </button>
          </FeatureGate>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t('activeMembers')}</span>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">
              {metrics ? metrics.activeMembers : '—'}
            </span>
            {metrics && <ChangeIndicator change={metrics.changes.activeMembers} />}
          </div>
          <p className="text-sm text-gray-500 mt-1">{t('thisMonth')}</p>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t('visits')}</span>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">
              {metrics ? metrics.visitsThisMonth.toLocaleString() : '—'}
            </span>
            {metrics && <ChangeIndicator change={metrics.changes.visitsThisMonth} />}
          </div>
          <p className="text-sm text-gray-500 mt-1">{t('thisMonth')}</p>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t('pointsRedeemed')}</span>
            <Gift className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">
              {metrics ? metrics.pointsRedeemedThisMonth.toLocaleString() : '—'}
            </span>
            {metrics && <ChangeIndicator change={metrics.changes.pointsRedeemedThisMonth} />}
          </div>
          <p className="text-sm text-gray-500 mt-1">{t('thisMonth')}</p>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t('retentionRate')}</span>
            <Percent className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">
              {metrics ? `${metrics.retentionRate}%` : '—'}
            </span>
            {metrics && <ChangeIndicator change={metrics.changes.retentionRate} />}
          </div>
          <p className="text-sm text-gray-500 mt-1">{t('activeTotalMembers')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Segments */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('memberSegments')}</h2>
          {memberSegments.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="space-y-4">
              {memberSegments.map((segment) => (
                <div key={segment.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{segment.name}</span>
                    <span className="text-sm text-gray-500">
                      {segment.count} members ({segment.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${segment.color} rounded-full`}
                      style={{ width: `${segment.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
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

        {/* Visits Heatmap — Pro/Scale only */}
        <FeatureGate plan={plan} feature="analytics_heatmap">
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
                      <div key={hour} className="flex-1 text-center text-xs text-gray-500">
                        {hour}:00
                      </div>
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

        {/* Top Rewards Redeemed */}
        <div className="bg-white rounded-xl border p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('popularServices')}</h2>
          {topRewards.length === 0 && data !== null ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              No redemptions yet. Rewards redeemed by members will appear here.
            </div>
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
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple-100 text-brand-purple font-bold text-sm">
                            {index + 1}
                          </span>
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
    </div>
  );
}
