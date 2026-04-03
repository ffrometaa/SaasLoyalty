'use client';

import { useState } from 'react';
import { Users, TrendingUp, TrendingDown, Minus, Calendar, Gift, Percent, Clock, Download } from 'lucide-react';
import { FeatureGate } from '../../../components/dashboard/FeatureGate';
import type { Plan } from '../../../lib/plans/features';

// TODO: replace with real tenant plan from session/context
const TENANT_PLAN: Plan = 'starter';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  // Mock data
  const metrics = {
    activeMembers: { value: 248, change: 12 },
    visitsThisMonth: { value: 1432, change: 8 },
    pointsRedeemed: { value: 12450, change: -3 },
    retentionRate: { value: 78, change: 5 },
  };

  const memberSegments = [
    { name: 'Frequent', count: 89, percentage: 36, color: 'bg-green-500' },
    { name: 'Regular', count: 67, percentage: 27, color: 'bg-blue-500' },
    { name: 'Occasional', count: 52, percentage: 21, color: 'bg-yellow-500' },
    { name: 'At Risk', count: 28, percentage: 11, color: 'bg-orange-500' },
    { name: 'Inactive', count: 12, percentage: 5, color: 'bg-red-500' },
  ];

  // Mock visits heatmap data
  const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 9 AM to 8 PM
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmapData = days.map((day, dayIndex) => {
    return hours.map((hour) => {
      // Generate mock data with peaks during lunch and evening
      let intensity = Math.random() * 30;
      if (hour >= 11 && hour <= 14) intensity += 40; // Lunch rush
      if (hour >= 17 && hour <= 20) intensity += 30; // Evening rush
      if (dayIndex >= 1 && dayIndex <= 5) intensity += 20; // Weekdays
      return Math.min(100, intensity);
    });
  });

  const topProducts = [
    { name: 'Deep Tissue Massage', visits: 156, revenue: 7800 },
    { name: 'Facial Treatment', visits: 134, revenue: 6700 },
    { name: 'Hot Stone Massage', visits: 98, revenue: 5880 },
    { name: 'Aromatherapy', visits: 87, revenue: 4350 },
    { name: 'Body Wrap', visits: 65, revenue: 3250 },
  ];

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

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your loyalty program performance</p>
        </div>
        <div className="flex items-center gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dateRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
          {/* Export — Scale only */}
          <FeatureGate plan={TENANT_PLAN} feature="analytics_export" silent>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:bg-gray-50 text-gray-600">
              <Download className="h-4 w-4" />
              Export
            </button>
          </FeatureGate>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Active Members</span>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">{metrics.activeMembers.value}</span>
            <ChangeIndicator change={metrics.activeMembers.change} />
          </div>
          <p className="text-sm text-gray-500 mt-1">+18 this month</p>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Visits</span>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">{metrics.visitsThisMonth.value.toLocaleString()}</span>
            <ChangeIndicator change={metrics.visitsThisMonth.change} />
          </div>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Points Redeemed</span>
            <Gift className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">{metrics.pointsRedeemed.value.toLocaleString()}</span>
            <ChangeIndicator change={metrics.pointsRedeemed.change} />
          </div>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Retention Rate</span>
            <Percent className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">{metrics.retentionRate.value}%</span>
            <ChangeIndicator change={metrics.retentionRate.change} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Active / Total members</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Segments */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Segments</h2>
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
          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">28 members at risk</p>
                <p className="text-sm text-amber-700">
                  Consider sending a reactivation campaign
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visits Heatmap — Pro/Scale only */}
        <FeatureGate plan={TENANT_PLAN} feature="analytics_heatmap">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h2>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Hour labels */}
                <div className="flex mb-2">
                  <div className="w-12" />
                  {hours.map((hour) => (
                    <div key={hour} className="flex-1 text-center text-xs text-gray-500">
                      {hour}:00
                    </div>
                  ))}
                </div>
                {/* Heatmap grid */}
                {days.map((day, dayIndex) => (
                  <div key={day} className="flex items-center mb-1">
                    <div className="w-12 text-sm text-gray-600">{day}</div>
                    {heatmapData[dayIndex].map((intensity, hourIndex) => (
                      <div
                        key={hourIndex}
                        className="flex-1 h-6 rounded-sm mx-0.5"
                        style={{
                          backgroundColor: `rgba(99, 102, 241, ${intensity / 100})`,
                        }}
                        title={`${intensity.toFixed(0)}% of daily visits`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Darker colors indicate higher visit frequency
            </p>
          </div>
        </FeatureGate>

        {/* Top Products */}
        <div className="bg-white rounded-xl border p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Services</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Service</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Visits</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={product.name} className="border-b last:border-0">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600">{product.visits}</td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">
                      ${product.revenue.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <ChangeIndicator change={Math.floor(Math.random() * 20 - 5)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
