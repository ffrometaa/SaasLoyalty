'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

const PLAN_MRR = Object.fromEntries(Object.entries({
  starter: 79,
  pro: 199,
  scale: 399,
  enterprise: 0,
}));

const STATUS_STYLES = Object.fromEntries(Object.entries({
  past_due: 'bg-yellow-500/15 text-yellow-400',
  trialing: 'bg-blue-500/15 text-blue-400',
}));

function LineTooltip({ active = false, payload = [{ dataKey: '', color: '', value: 0 }].slice(0, 0), label = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>${p.value.toLocaleString()}/mo</p>
      ))}
    </div>
  );
}

export function RevenueCharts({
  mrrGrowth = [{ month: '', mrr: 0 }].slice(0, 0),
  planDist = [{ plan: '', count: 0, pct: '0', mrr: 0, mrrPct: '0' }].slice(0, 0),
  atRiskTenants = [{ id: '', business_name: '', plan_status: '', trial_ends_at: '', plan: '' }].slice(0, 0),
}) {
  return (
    <div className="space-y-6">
      {/* MRR Growth */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-1">MRR Growth</h2>
        <p className="text-xs text-slate-500 mb-4">Monthly recurring revenue over the last 12 months</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mrrGrowth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip content={<LineTooltip active={undefined} payload={undefined} label={undefined} />} />
            <Line type="monotone" dataKey="mrr" stroke="#7c3aed" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Plan distribution */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-1">Plan Distribution</h2>
        <p className="text-xs text-slate-500 mb-4">Active tenants and revenue per plan</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Plan', 'Tenants', '% of Total', 'MRR', '% of MRR'].map(h => (
                  <th key={h} className="text-left pb-2 pr-6 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {planDist.map(row => (
                <tr key={row.plan}>
                  <td className="py-2 pr-6 font-semibold text-white capitalize">{row.plan}</td>
                  <td className="py-2 pr-6 text-slate-300">{row.count}</td>
                  <td className="py-2 pr-6 text-slate-400">{row.pct}%</td>
                  <td className="py-2 pr-6 text-slate-300">${row.mrr.toLocaleString()}</td>
                  <td className="py-2 pr-6 text-slate-400">{row.mrrPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* At-risk tenants */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-1">At-Risk Tenants</h2>
        <p className="text-xs text-slate-500 mb-4">Past due or trial ending in less than 3 days</p>
        {atRiskTenants.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No at-risk tenants right now</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Business', 'Status', 'Trial Ends', 'MRR at Risk', 'Action'].map(h => (
                    <th key={h} className="text-left pb-2 pr-4 text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {atRiskTenants.map(t => (
                  <tr key={t.id}>
                    <td className="py-2 pr-4 font-medium text-white">{t.business_name}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[t.plan_status] ?? 'bg-slate-500/15 text-slate-300'}`}>
                        {t.plan_status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-400">
                      {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 pr-4 text-slate-300">
                      ${PLAN_MRR[t.plan] ?? 0}/mo
                    </td>
                    <td className="py-2 pr-4">
                      <Link href={`/admin/tenants/${t.id}`}
                        className="text-[#a78bfa] hover:underline text-[10px] font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
