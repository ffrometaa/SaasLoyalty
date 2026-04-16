'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const PLAN_COLORS = Object.fromEntries(Object.entries({
  starter: '#64748b',
  pro: '#7c3aed',
  scale: '#2563eb',
  enterprise: '#059669',
}));

const PLAN_LABELS = Object.fromEntries(Object.entries({
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
  enterprise: 'Enterprise',
}));

const ACTION_COLORS = Object.fromEntries(Object.entries({
  plan_change: 'bg-purple-500/20 text-purple-300',
  tenant_suspend: 'bg-red-500/20 text-red-300',
  tenant_reactivate: 'bg-green-500/20 text-green-300',
  tenant_delete: 'bg-red-700/20 text-red-400',
  plan_preview_set: 'bg-amber-500/20 text-amber-300',
  plan_preview_exit: 'bg-slate-500/20 text-slate-300',
  config_update: 'bg-blue-500/20 text-blue-300',
  admin_invite: 'bg-cyan-500/20 text-cyan-300',
}));

interface TenantGrowthPoint { month: string; count: number; }
interface RecentEvent { id: string; action_type: string; target_type: string; target_id: string | null; created_at: string; super_admins: { full_name: string; email: string } | null; }
interface AdminChartsProps { mrrByPlan?: Record<string, number>; tenantGrowth?: TenantGrowthPoint[]; recentEvents?: RecentEvent[]; }

function CustomTooltip({ active = false, payload = [{ name: '', value: 0 }].slice(0, 0) }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{payload[0].name}</p>
      <p className="text-slate-300">${payload[0].value}/mo</p>
    </div>
  );
}

function BarTooltip({ active = false, payload = [{ value: 0 }].slice(0, 0), label = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{label}</p>
      <p className="text-slate-300">{payload[0].value} new tenants</p>
    </div>
  );
}

export function AdminCharts({
  mrrByPlan = Object.fromEntries(Object.entries({ '': 0 })),
  tenantGrowth = [{ month: '', count: 0 }].slice(0, 0),
  recentEvents = [{ id: '', action_type: '', target_type: '', target_id: null, created_at: '', super_admins: null }].slice(0, 0),
}: AdminChartsProps) {
  const pieData = Object.entries(mrrByPlan)
    .filter(([, v]) => v > 0)
    .map(([plan, value]) => ({ name: PLAN_LABELS[plan] ?? plan, value, plan }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* MRR by Plan Donut */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-1">MRR by Plan</h2>
        <p className="text-xs text-slate-500 mb-4">Revenue distribution across plan tiers</p>
        {pieData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-500 text-sm">No active paying tenants</div>
        ) : (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={PLAN_COLORS[entry.plan] ?? '#7c3aed'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip active={undefined} payload={undefined} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PLAN_COLORS[entry.plan] ?? '#7c3aed' }} />
                  <span className="text-slate-300">{entry.name}</span>
                  <span className="text-slate-500 ml-auto">${entry.value}/mo</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tenant Growth Bar Chart */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-1">Tenant Growth</h2>
        <p className="text-xs text-slate-500 mb-4">New tenants per month (last 12 months)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={tenantGrowth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<BarTooltip active={undefined} payload={undefined} label={undefined} />} />
            <Bar dataKey="count" fill="#7c3aed" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Platform Events */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 lg:col-span-2">
        <h2 className="text-sm font-semibold text-white mb-1">Recent Platform Events</h2>
        <p className="text-xs text-slate-500 mb-4">Latest admin actions across the platform</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left pb-2 text-slate-500 font-medium pr-4">Admin</th>
                <th className="text-left pb-2 text-slate-500 font-medium pr-4">Action</th>
                <th className="text-left pb-2 text-slate-500 font-medium pr-4">Target</th>
                <th className="text-left pb-2 text-slate-500 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {recentEvents.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">No events yet</td></tr>
              ) : recentEvents.map(evt => (
                <tr key={evt.id}>
                  <td className="py-2 pr-4 text-slate-300">
                    {evt.super_admins?.full_name || evt.super_admins?.email || '—'}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ACTION_COLORS[evt.action_type] ?? 'bg-slate-500/20 text-slate-300'}`}>
                      {evt.action_type}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-400">
                    {evt.target_type} {evt.target_id ? `· ${String(evt.target_id).slice(0, 8)}…` : ''}
                  </td>
                  <td className="py-2 text-slate-500">
                    {new Date(evt.created_at).toLocaleString()}
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
