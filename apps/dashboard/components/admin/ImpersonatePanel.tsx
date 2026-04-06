'use client';

import { useState, useTransition } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantRow {
  id: string;
  business_name: string;
  slug: string;
  plan: string;
  plan_status: string;
  auth_user_id: string;
  created_at: string;
}

interface MemberRow {
  id: string;
  tenant_id: string;
  tenant_name: string;
  email: string;
  name: string;
  tier: string;
  points_balance: number;
  status: string;
}

interface LogRow {
  id: string;
  impersonation_level: string;
  started_at: string;
  ended_at: string | null;
  reason: string | null;
  target_member_id: string | null;
  target_tenant_id: string | null;
  admin_name: string;
  admin_email: string;
}

interface ActiveSession {
  token: string;
  targetType: 'tenant' | 'member';
  targetName: string;
  targetEmail: string;
  expiresIn: number;
  startedAt: number;
}

interface Props {
  tenants: TenantRow[];
  members: MemberRow[];
  recentLogs: LogRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, string> = {
  starter:    'bg-slate-500/15 text-slate-300 border border-slate-500/25',
  pro:        'bg-purple-500/15 text-purple-300 border border-purple-500/25',
  scale:      'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  enterprise: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
};

const TIER_BADGE: Record<string, string> = {
  bronze:   'bg-orange-500/15 text-orange-300 border border-orange-500/25',
  silver:   'bg-slate-400/15 text-slate-300 border border-slate-400/25',
  gold:     'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25',
  platinum: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25',
};

function Badge({ label = '', style = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${style}`}>
      {label}
    </span>
  );
}

function secondsToMinutes(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.round(s / 60)}m`;
}

// ─── ImpersonatePanel ─────────────────────────────────────────────────────────

export function ImpersonatePanel({ tenants, members, recentLogs }: Props) {
  const [tab, setTab] = useState<'tenants' | 'members' | 'logs'>('tenants');
  const [search, setSearch] = useState('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredTenants = tenants.filter(t =>
    t.business_name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMembers = members.filter(m =>
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.tenant_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleImpersonate(targetType: 'tenant' | 'member', targetId: string, reason?: string) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/impersonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType, targetId, reason }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Impersonation failed');
          return;
        }
        const session: ActiveSession = {
          token:       data.accessToken,
          targetType:  data.targetType,
          targetName:  data.targetName,
          targetEmail: data.targetEmail,
          expiresIn:   data.expiresIn,
          startedAt:   Date.now(),
        };
        setActiveSession(session);

        if (targetType === 'member') {
          const memberAppUrl = process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? '';
          window.open(`${memberAppUrl}/impersonate?token=${data.accessToken}`, '_blank');
        }
      } catch {
        setError('Network error — could not reach impersonation API');
      }
    });
  }

  async function handleEndSession() {
    if (!activeSession) return;
    setError(null);
    startTransition(async () => {
      try {
        await fetch('/api/auth/impersonate', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: activeSession.token }),
        });
        setActiveSession(null);
      } catch {
        setError('Could not end session — please try again');
      }
    });
  }

  return (
    <div className="space-y-6">

      {/* Active session banner */}
      {activeSession && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-yellow-300">
              Impersonation active — {activeSession.targetType === 'tenant' ? 'Tenant Owner' : 'Member'}
            </p>
            <p className="text-xs text-yellow-400/80 mt-0.5">
              {activeSession.targetName} · {activeSession.targetEmail} ·{' '}
              Token expires in {secondsToMinutes(activeSession.expiresIn)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeSession.targetType === 'member' && (
              <button
                onClick={() => {
                  const memberAppUrl = process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? '';
                  window.open(`${memberAppUrl}/impersonate?token=${activeSession.token}`, '_blank');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
              >
                Reopen app
              </button>
            )}
            <button
              onClick={handleEndSession}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
            >
              End Session
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, email or slug…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50 focus:bg-white/[0.06]"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
        {(['tenants', 'members', 'logs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-[#7c3aed] text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t === 'tenants' ? `Tenants (${filteredTenants.length})`
              : t === 'members' ? `Members (${filteredMembers.length})`
              : `Audit Log (${recentLogs.length})`}
          </button>
        ))}
      </div>

      {/* ── TENANTS TAB ──────────────────────────────────────────── */}
      {tab === 'tenants' && (
        <div className="rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Business</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{tenant.business_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">/{tenant.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={tenant.plan} style={PLAN_BADGE[tenant.plan] ?? ''} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${tenant.plan_status === 'active' ? 'text-green-400' : 'text-slate-400'}`}>
                      {tenant.plan_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleImpersonate('tenant', tenant.id, 'Admin investigation')}
                      disabled={isPending || !!activeSession}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30 hover:bg-[#7c3aed]/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Loading…' : 'View as Owner'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No tenants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MEMBERS TAB ──────────────────────────────────────────── */}
      {tab === 'members' && (
        <div className="rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Member</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Tenant</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Points</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{member.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{member.tenant_name}</td>
                  <td className="px-4 py-3">
                    <Badge label={member.tier} style={TIER_BADGE[member.tier] ?? ''} />
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                    {member.points_balance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleImpersonate('member', member.id, 'Admin investigation')}
                      disabled={isPending || !!activeSession}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30 hover:bg-[#7c3aed]/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Loading…' : 'View as Member'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No active members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AUDIT LOG TAB ─────────────────────────────────────────── */}
      {tab === 'logs' && (
        <div className="rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Level</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Started</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {recentLogs.map(log => {
                const started  = new Date(log.started_at);
                const ended    = log.ended_at ? new Date(log.ended_at) : null;
                const duration = ended
                  ? secondsToMinutes(Math.round((ended.getTime() - started.getTime()) / 1000))
                  : 'Ongoing';

                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                        log.impersonation_level === 'super_admin_to_tenant'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/25'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/25'
                      }`}>
                        {log.impersonation_level.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{log.admin_name || log.admin_email}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{started.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{duration}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.reason ?? '—'}</td>
                  </tr>
                );
              })}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No impersonation sessions recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
