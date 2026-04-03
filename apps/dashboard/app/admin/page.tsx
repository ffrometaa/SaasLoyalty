'use client';

import { useEffect, useState } from 'react';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-yellow-100 text-yellow-700',
  canceled: 'bg-red-100 text-red-700',
};

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700',
  pro: 'bg-brand-purple-100 text-brand-purple-700',
  scale: 'bg-purple-100 text-purple-700',
};

const DEFAULT_STATS = {
  totalTenants: 0,
  activeTenants: 0,
  trialingTenants: 0,
  canceledTenants: 0,
  totalMembers: 0,
  recentTenants: [] as any[],
};

function MetricCard({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => {
        if (r.status === 403 || r.status === 401) {
          window.location.href = '/';
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        if (data.error) { setError(data.error); setLoading(false); return; }
        setStats({ ...DEFAULT_STATS, ...data, recentTenants: data.recentTenants ?? [] });
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-600 mt-1">All businesses using LoyaltyOS</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard title="Total Businesses" value={stats.totalTenants} />
        <MetricCard title="Active" value={stats.activeTenants} sub="Paying subscribers" />
        <MetricCard title="Trialing" value={stats.trialingTenants} sub="Free trial" />
        <MetricCard title="Total Members" value={stats.totalMembers} sub="Across all businesses" />
      </div>

      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-600">Business</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Plan</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Members</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.recentTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No businesses yet</td>
                </tr>
              ) : stats.recentTenants.map((tenant: any) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{tenant.business_name}</p>
                    <p className="text-xs text-gray-500">{tenant.slug}</p>
                  </td>
                  <td className="px-6 py-4 capitalize text-gray-600">{tenant.business_type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${PLAN_BADGE[tenant.plan] ?? 'bg-gray-100 text-gray-700'}`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${STATUS_BADGE[tenant.plan_status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {tenant.plan_status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{tenant.member_count}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
