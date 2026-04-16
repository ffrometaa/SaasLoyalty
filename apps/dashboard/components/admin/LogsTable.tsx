'use client';

import { useState } from 'react';

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

interface PlatformEvent {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  super_admins: { id: string; full_name: string; email: string } | null;
}

interface AdminSummary {
  id: string;
  full_name: string;
  email: string;
}

interface LogsTableProps {
  initialEvents?: PlatformEvent[];
  admins?: AdminSummary[];
}

function exportToCsv(events: PlatformEvent[] = [{ id: '', created_at: '', action_type: '', target_type: '', target_id: '', metadata: null, super_admins: { id: '', email: '', full_name: '' } }].slice(0, 0)) {
  const header = 'timestamp,admin,action_type,target_type,target_id,metadata\n';
  const rows = events.map(e =>
    [
      new Date(e.created_at).toISOString(),
      e.super_admins?.email ?? '',
      e.action_type,
      e.target_type ?? '',
      e.target_id ?? '',
      JSON.stringify(e.metadata ?? {}),
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `platform-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LogsTable({
  initialEvents = [{ id: '', action_type: '', target_type: '', target_id: '', metadata: null, created_at: '', super_admins: { id: '', full_name: '', email: '' } }].slice(0, 0),
  admins = [{ id: '', full_name: '', email: '' }].slice(0, 0),
}: LogsTableProps) {
  const [events] = useState(initialEvents);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState('');

  const actionTypes = Array.from(new Set(events.map(e => e.action_type))).sort();

  let filtered = events.filter(e => {
    const matchSearch = !search ||
      e.target_id?.includes(search) ||
      e.target_type?.includes(search) ||
      e.super_admins?.email?.includes(search);
    const matchAction = actionFilter === 'all' || e.action_type === actionFilter;
    const matchAdmin = adminFilter === 'all' || e.super_admins?.id === adminFilter;
    const matchFrom = !dateFrom || e.created_at >= new Date(dateFrom).toISOString();
    const matchTo = !dateTo || e.created_at <= new Date(dateTo + 'T23:59:59').toISOString();
    return matchSearch && matchAction && matchAdmin && matchFrom && matchTo;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input type="text" placeholder="Search target or email…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 w-56 placeholder:text-slate-500 focus:outline-none" />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">All Actions</option>
          {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={adminFilter} onChange={e => setAdminFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">All Admins</option>
          {admins.map(a => <option key={a.id} value={a.id}>{a.full_name || a.email}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none" />
        <button onClick={() => exportToCsv(filtered)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Timestamp</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Admin</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Action</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Target</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No events found</td></tr>
              ) : filtered.map(e => (
                <>
                  <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">
                      {e.super_admins?.full_name || e.super_admins?.email || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ACTION_COLORS[e.action_type] ?? 'bg-slate-500/20 text-slate-300'}`}>
                        {e.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {e.target_type ?? '—'}{e.target_id ? ` · ${String(e.target_id).slice(0, 12)}${e.target_id.length > 12 ? '…' : ''}` : ''}
                    </td>
                    <td className="px-4 py-2.5">
                      {e.metadata && Object.keys(e.metadata).length > 0 && (
                        <button onClick={() => setExpanded(expanded === e.id ? '' : e.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors">
                          {expanded === e.id ? '▾' : '▸'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded && expanded === e.id && (
                    <tr key={`${e.id}-expanded`} className="bg-white/[0.01]">
                      <td colSpan={5} className="px-4 pb-3 pt-1">
                        <pre className="text-[10px] text-slate-400 bg-white/[0.03] rounded p-3 overflow-x-auto font-mono">
                          {JSON.stringify(e.metadata, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-3">{filtered.length} events</p>
    </>
  );
}
