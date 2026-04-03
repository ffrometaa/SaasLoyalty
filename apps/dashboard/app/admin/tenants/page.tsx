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

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/tenants')
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
        setTenants(data.tenants ?? []);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = tenants.filter(t =>
    t.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.slug?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Businesses</h1>
          <p className="text-gray-600 mt-1">{tenants.length} registered businesses</p>
        </div>
        <input
          type="text"
          placeholder="Search businesses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple w-64"
        />
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-600">Business</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Plan</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Members</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Active</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Stripe ID</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {search ? 'No businesses match your search' : 'No businesses yet'}
                  </td>
                </tr>
              ) : filtered.map((tenant: any) => (
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
                  <td className="px-6 py-4 text-gray-600">{tenant.active_members}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                    {tenant.stripe_customer_id ? tenant.stripe_customer_id.slice(0, 14) + '…' : '—'}
                  </td>
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
