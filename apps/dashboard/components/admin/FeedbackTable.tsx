'use client';

import { Fragment, useState } from 'react';
import { cn } from '@loyalty-os/ui';

type FeedbackStatus = 'new' | 'read' | 'resolved';
type FeedbackSource = 'tenant' | 'member';
type FeedbackType = 'bug' | 'feature' | 'suggestion' | 'general';

export interface FeedbackRow {
  id: string;
  source: FeedbackSource;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  created_at: string;
  tenant_name: string | null;
  user_email: string | null;
}

interface FeedbackTableProps {
  initialRows: FeedbackRow[];
}

const SOURCE_COLORS: Record<FeedbackSource, string> = {
  tenant: 'bg-purple-500/20 text-purple-300',
  member: 'bg-cyan-500/20 text-cyan-300',
};

const TYPE_COLORS: Record<FeedbackType, string> = {
  bug: 'bg-red-500/20 text-red-300',
  feature: 'bg-amber-500/20 text-amber-300',
  suggestion: 'bg-blue-500/20 text-blue-300',
  general: 'bg-slate-500/20 text-slate-300',
};

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: 'bg-green-500/20 text-green-300',
  read: 'bg-slate-500/20 text-slate-400',
  resolved: 'bg-slate-700/20 text-slate-500',
};

function exportToCsv(rows: FeedbackRow[]): void {
  const header = 'timestamp,source,type,status,tenant,email,message\n';
  const body = rows.map(r =>
    [
      new Date(r.created_at).toISOString(),
      r.source,
      r.type,
      r.status,
      r.tenant_name ?? '',
      r.user_email ?? '',
      r.message,
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n');

  const blob = new Blob([header + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FeedbackTable({ initialRows }: FeedbackTableProps): JSX.Element {
  const [rows, setRows] = useState<FeedbackRow[]>(initialRows);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<FeedbackSource | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [expanded, setExpanded] = useState('');
  const [updating, setUpdating] = useState('');

  const filtered = rows.filter(r => {
    const matchSearch = !search ||
      r.message.toLowerCase().includes(search.toLowerCase()) ||
      (r.tenant_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.user_email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchSource = sourceFilter === 'all' || r.source === sourceFilter;
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchSource && matchType && matchStatus;
  });

  async function updateStatus(id: string, status: FeedbackStatus): Promise<void> {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) return;
      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } finally {
      setUpdating('');
    }
  }

  const inputClass = 'bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none placeholder:text-slate-500';

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search message, tenant or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={cn(inputClass, 'w-64 text-white')}
        />
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as FeedbackSource | 'all')} className={inputClass}>
          <option value="all">All Sources</option>
          <option value="tenant">Tenant</option>
          <option value="member">Member</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as FeedbackType | 'all')} className={inputClass}>
          <option value="all">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="suggestion">Suggestion</option>
          <option value="general">General</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as FeedbackStatus | 'all')} className={inputClass}>
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="resolved">Resolved</option>
        </select>
        <button
          onClick={() => exportToCsv(filtered)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-brand-purple hover:bg-brand-purple-700 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Source</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">From</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Message</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No feedback found</td>
                </tr>
              ) : filtered.map(r => (
                <Fragment key={r.id}>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold', SOURCE_COLORS[r.source])}>
                        {r.source}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold', TYPE_COLORS[r.type])}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 max-w-[160px] truncate">
                      <span title={r.user_email ?? ''}>{r.tenant_name ?? r.user_email ?? '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 max-w-[280px] truncate">
                      <span title={r.message}>{r.message}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={r.status}
                        disabled={updating === r.id}
                        onChange={e => updateStatus(r.id, e.target.value as FeedbackStatus)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-semibold border-0 cursor-pointer disabled:opacity-50',
                          STATUS_COLORS[r.status],
                          'bg-transparent focus:outline-none'
                        )}
                      >
                        <option value="new">new</option>
                        <option value="read">read</option>
                        <option value="resolved">resolved</option>
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setExpanded(expanded === r.id ? '' : r.id)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label="Toggle message"
                      >
                        {expanded === r.id ? '▾' : '▸'}
                      </button>
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr className="bg-white/[0.01]">
                      <td colSpan={7} className="px-4 pb-4 pt-2">
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                          <div className="flex items-center gap-4 mb-2 text-[11px] text-slate-500">
                            {r.user_email && <span>Email: <span className="text-slate-300">{r.user_email}</span></span>}
                            {r.tenant_name && <span>Tenant: <span className="text-slate-300">{r.tenant_name}</span></span>}
                            <span>Submitted: <span className="text-slate-300">{new Date(r.created_at).toLocaleString()}</span></span>
                          </div>
                          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{r.message}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-3">{filtered.length} of {rows.length} submissions</p>
    </>
  );
}
