'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { suspendTenant, reactivateTenant, deleteTenant, changeTenantPlan } from '@/lib/admin/actions';

const STATUS_STYLES = Object.fromEntries(Object.entries({
  active: 'bg-green-500/15 text-green-400 border border-green-500/25',
  trialing: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  past_due: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  canceled: 'bg-red-500/15 text-red-400 border border-red-500/25',
}));

const PLAN_STYLES = Object.fromEntries(Object.entries({
  starter: 'bg-slate-500/15 text-slate-300 border border-slate-500/25',
  pro: 'bg-purple-500/15 text-purple-300 border border-purple-500/25',
  scale: 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  enterprise: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
}));

interface ActionMenuTenant {
  id: string;
  business_name: string;
  plan: string | null;
  plan_status: string | null;
  stripe_customer_id: string | null;
}

interface TenantRow extends ActionMenuTenant {
  business_type: string | null;
  slug: string | null;
  trial_ends_at: string | null;
  created_at: string;
  auth_user_id: string | null;
  member_count: number;
  owner_email: string;
  last_activity_at: string | null;
  mrr: number;
}

interface TenantsTableProps {
  initialTenants?: TenantRow[];
}

function ActionMenu({ tenant = { id: '', business_name: '', plan: '', plan_status: '', stripe_customer_id: null }, onAction = (_type: string, _tenant: ActionMenuTenant) => {} }: { tenant?: ActionMenuTenant; onAction?: (type: string, tenant: ActionMenuTenant) => void }) {
  const [open, setOpen] = useState(false);

  const stripeUrl = tenant.stripe_customer_id
    ? `https://dashboard.stripe.com/customers/${tenant.stripe_customer_id}`
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-52 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
            <Link href={`/admin/tenants/${tenant.id}`} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
              View Details
            </Link>
            <button onClick={() => { setOpen(false); onAction('changePlan', tenant); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left">
              Change Plan
            </button>
            <Link href={`/?impersonate=${tenant.id}`} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
              Impersonate Dashboard
            </Link>
            {stripeUrl && (
              <a href={stripeUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                View in Stripe ↗
              </a>
            )}
            <div className="border-t border-white/[0.06] my-1" />
            {tenant.plan_status === 'canceled' ? (
              <button onClick={() => { setOpen(false); onAction('reactivate', tenant); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-green-400 hover:bg-white/5 transition-colors text-left">
                Reactivate Account
              </button>
            ) : (
              <button onClick={() => { setOpen(false); onAction('suspend', tenant); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-yellow-400 hover:bg-white/5 transition-colors text-left">
                Suspend Account
              </button>
            )}
            <button onClick={() => { setOpen(false); onAction('delete', tenant); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 transition-colors text-left">
              Delete Tenant
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TenantsTable({ initialTenants = [{ id: '', business_name: '', business_type: null, slug: null, plan: null, plan_status: null, stripe_customer_id: null, trial_ends_at: null, created_at: '', auth_user_id: null, member_count: 0, owner_email: '', last_activity_at: null, mrr: 0 }].slice(0, 0) }: TenantsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tenants, setTenants] = useState(initialTenants);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState({ id: '', business_name: '', plan: '', plan_status: '' });
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Change plan dialog
  const [changePlanTarget, setChangePlanTarget] = useState({ id: '', business_name: '', plan: '' });
  const [newPlan, setNewPlan] = useState('');
  const [planReason, setPlanReason] = useState('');
  const [planExpiry, setPlanExpiry] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  function handleAction(type: string, tenant: ActionMenuTenant) {
    if (type === 'delete') { setDeleteTarget({ id: tenant.id, business_name: tenant.business_name, plan: tenant.plan ?? '', plan_status: tenant.plan_status ?? '' }); setDeleteConfirmName(''); }
    if (type === 'suspend') {
      startTransition(async () => {
        await suspendTenant(tenant.id, '');
        router.refresh();
      });
    }
    if (type === 'reactivate') {
      startTransition(async () => {
        await reactivateTenant(tenant.id);
        router.refresh();
      });
    }
    if (type === 'changePlan') {
      setChangePlanTarget({ id: tenant.id, business_name: tenant.business_name, plan: tenant.plan ?? '' });
      setNewPlan(tenant.plan ?? '');
      setPlanReason('');
      setPlanExpiry('');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget.id || deleteConfirmName !== deleteTarget.business_name) {
      setErrorMsg('Business name does not match');
      return;
    }
    startTransition(async () => {
      await deleteTenant(deleteTarget.id);
      setDeleteTarget({ id: '', business_name: '', plan: '', plan_status: '' });
      router.refresh();
    });
  }

  async function confirmChangePlan() {
    if (!changePlanTarget.id || !newPlan) return;
    startTransition(async () => {
      await changeTenantPlan(changePlanTarget.id, newPlan, planReason, planExpiry);
      setChangePlanTarget({ id: '', business_name: '', plan: '' });
      router.refresh();
    });
  }

  // Filter + sort
  let filtered = tenants.filter(t => {
    const matchSearch = !search ||
      t.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.owner_email?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || t.plan === planFilter;
    const matchStatus = statusFilter === 'all' || t.plan_status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === 'mrr_desc') return b.mrr - a.mrr;
    if (sort === 'members') return b.member_count - a.member_count;
    return 0;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 w-64 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50"
        />
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="scale">Scale</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="mrr_desc">MRR ↓</option>
          <option value="members">Members ↓</option>
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Business</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Owner</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Members</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">MRR</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Joined</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Last Activity</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isPending ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Processing…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No tenants found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/tenants/${t.id}`} className="hover:text-[#a78bfa] transition-colors">
                      <p className="font-medium text-white">{t.business_name}</p>
                      <p className="text-slate-500 capitalize">{t.business_type || '—'}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{t.owner_email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${PLAN_STYLES[t.plan ?? ''] ?? 'bg-slate-500/15 text-slate-300'}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[t.plan_status ?? ''] ?? 'bg-slate-500/15 text-slate-300'}`}>
                      {t.plan_status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{t.member_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300">{t.mrr > 0 ? `$${t.mrr}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {t.last_activity_at ? new Date(t.last_activity_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu tenant={t} onAction={handleAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget.id && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Tenant</h3>
            <p className="text-sm text-slate-400 mb-4">
              This action cannot be undone. Type <strong className="text-white">{deleteTarget.business_name}</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={e => { setDeleteConfirmName(e.target.value); setErrorMsg(''); }}
              placeholder={deleteTarget.business_name}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-1 focus:ring-red-500/50"
            />
            {errorMsg && <p className="text-red-400 text-xs mb-3">{errorMsg}</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget({ id: '', business_name: '', plan: '', plan_status: '' })}
                className="flex-1 px-4 py-2 rounded-lg text-sm text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirmName !== deleteTarget.business_name || isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change plan modal */}
      {changePlanTarget.id && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1">Change Plan</h3>
            <p className="text-sm text-slate-400 mb-4">{changePlanTarget.business_name}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['starter', 'pro', 'scale', 'enterprise'].map(p => (
                <button key={p} onClick={() => setNewPlan(p)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${newPlan === p ? 'bg-[#7c3aed] text-white' : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'}`}>
                  {p}
                </button>
              ))}
            </div>
            <textarea
              value={planReason}
              onChange={e => setPlanReason(e.target.value)}
              placeholder="Reason (optional)…"
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 mb-3 focus:outline-none resize-none placeholder:text-slate-500"
            />
            <input
              type="datetime-local"
              value={planExpiry}
              onChange={e => setPlanExpiry(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none"
            />
            <p className="text-xs text-slate-500 -mt-2 mb-4">Optional: expiry date for temporary override</p>
            <div className="flex gap-3">
              <button onClick={() => setChangePlanTarget({ id: '', business_name: '', plan: '' })}
                className="flex-1 px-4 py-2 rounded-lg text-sm text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                Cancel
              </button>
              <button onClick={confirmChangePlan} disabled={isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 transition-colors">
                Save Change
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
