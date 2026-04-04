'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { changeTenantPlan, suspendTenant, reactivateTenant } from '@/lib/admin/actions';

const STATUS_STYLES = Object.fromEntries(Object.entries({
  active: 'bg-green-500/15 text-green-400',
  trialing: 'bg-blue-500/15 text-blue-400',
  past_due: 'bg-yellow-500/15 text-yellow-400',
  canceled: 'bg-red-500/15 text-red-400',
}));

function getPlanMRR(plan = '') {
  if (plan === 'starter') return 79;
  if (plan === 'pro') return 199;
  if (plan === 'scale') return 399;
  return 0;
}

function Section({ title = '', children = <></> }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-6">
      <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label = '', children = <></> }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-slate-500 w-40 shrink-0">{label}</span>
      <span className="text-xs text-slate-300 text-right">{children}</span>
    </div>
  );
}

export function TenantDetailClient({ data = { tenant: { id: '', business_name: '', business_type: '', plan: '', plan_status: '', stripe_customer_id: null, stripe_subscription_id: null, owner_email: '', trial_ends_at: null, created_at: '', slug: '' }, members: [{ id: '', name: '', email: '', tier: '', points: 0, total_visits: 0, last_visit_at: null, status: '' }].slice(0, 0), memberCount: 0, campaigns: [{ id: '', name: '', type: '', status: '', recipient_count: 0, sent_at: null, created_at: '' }].slice(0, 0), events: [{ id: '', action_type: '', target_type: '', created_at: '', super_admins: { full_name: '', email: '' } }].slice(0, 0), metrics: { activeMembers: 0, visitsThisMonth: 0, redemptions: 0 } } }) {
  const { tenant, members, memberCount, campaigns, events, metrics } = data;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState(tenant.plan);
  const [planReason, setPlanReason] = useState('');
  const [planExpiry, setPlanExpiry] = useState('');

  const mrr = tenant.plan_status === 'active' ? getPlanMRR(tenant.plan) : 0;
  const stripeCustomerUrl = tenant.stripe_customer_id
    ? `https://dashboard.stripe.com/customers/${tenant.stripe_customer_id}`
    : null;
  const stripeSubUrl = tenant.stripe_subscription_id
    ? `https://dashboard.stripe.com/subscriptions/${tenant.stripe_subscription_id}`
    : null;

  function handleChangePlan() {
    startTransition(async () => {
      await changeTenantPlan(tenant.id, newPlan, planReason, planExpiry);
      setShowPlanForm(false);
      router.refresh();
    });
  }

  function handleSuspend() {
    startTransition(async () => {
      await suspendTenant(tenant.id, '');
      router.refresh();
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      await reactivateTenant(tenant.id);
      router.refresh();
    });
  }

  return (
    <div>
      {/* Back + title */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/tenants" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Tenants
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{tenant.business_name}</h1>
          <p className="text-slate-400 text-sm capitalize">{tenant.business_type ?? 'business'}</p>
        </div>
      </div>

      {/* Section 1 — Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Members', value: metrics.activeMembers.toLocaleString() },
          { label: 'Total Members', value: memberCount.toLocaleString() },
          { label: 'Visits This Month', value: metrics.visitsThisMonth.toLocaleString() },
          { label: 'Total Redemptions', value: metrics.redemptions.toLocaleString() },
        ].map(m => (
          <div key={m.label} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-xl font-bold text-white">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Section 2 — Business info */}
      <Section title="Business Information">
        <>
          <InfoRow label="Business Name"><>{tenant.business_name}</></InfoRow>
          <InfoRow label="Business Type"><>{tenant.business_type}</></InfoRow>
          <InfoRow label="Slug"><>{tenant.slug}</></InfoRow>
          <InfoRow label="Owner Email"><>{tenant.owner_email}</></InfoRow>
          <InfoRow label="Created"><>{new Date(tenant.created_at).toLocaleString()}</></InfoRow>
        </>
      </Section>

      {/* Section 3 — Plan & billing */}
      <Section title="Plan & Billing">
        <>
        <InfoRow label="Current Plan">
          <><span className="capitalize font-semibold text-white">{tenant.plan}</span></>
        </InfoRow>
        <InfoRow label="Status">
          <><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[tenant.plan_status] ?? ''}`}>
            {tenant.plan_status?.replace('_', ' ')}
          </span></>
        </InfoRow>
        <InfoRow label="MRR"><>{mrr > 0 ? `$${mrr}/mo` : 'No revenue'}</></InfoRow>
        <InfoRow label="Stripe Customer">
          <>{stripeCustomerUrl
            ? <a href={stripeCustomerUrl} target="_blank" rel="noopener noreferrer" className="text-[#a78bfa] hover:underline font-mono text-[11px]">{tenant.stripe_customer_id}</a>
            : '—'}</>
        </InfoRow>
        <InfoRow label="Stripe Subscription">
          <>{stripeSubUrl
            ? <a href={stripeSubUrl} target="_blank" rel="noopener noreferrer" className="text-[#a78bfa] hover:underline font-mono text-[11px]">{tenant.stripe_subscription_id}</a>
            : '—'}</>
        </InfoRow>
        {tenant.trial_ends_at ? (
          <InfoRow label="Trial Ends"><>{new Date(tenant.trial_ends_at).toLocaleDateString()}</></InfoRow>
        ) : <></>}

        <div className="mt-4 flex gap-3">
          <button onClick={() => setShowPlanForm(o => !o)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors">
            Change Plan
          </button>
          {tenant.plan_status === 'canceled' ? (
            <button onClick={handleReactivate} disabled={isPending}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-50">
              Reactivate
            </button>
          ) : (
            <button onClick={handleSuspend} disabled={isPending}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors disabled:opacity-50">
              Suspend
            </button>
          )}
        </div>

        {showPlanForm ? (
          <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-lg">
            <p className="text-xs text-slate-400 mb-3">Select new plan:</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {['starter', 'pro', 'scale', 'enterprise'].map(p => (
                <button key={p} onClick={() => setNewPlan(p)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${newPlan === p ? 'bg-[#7c3aed] text-white' : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'}`}>
                  {p}
                </button>
              ))}
            </div>
            <textarea value={planReason} onChange={e => setPlanReason(e.target.value)}
              placeholder="Reason (optional)…" rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 mb-2 resize-none focus:outline-none" />
            <input type="datetime-local" value={planExpiry} onChange={e => setPlanExpiry(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 mb-3 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowPlanForm(false)}
                className="flex-1 px-3 py-2 rounded-lg text-xs text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] transition-colors">Cancel</button>
              <button onClick={handleChangePlan} disabled={isPending}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">Save</button>
            </div>
          </div>
        ) : null}
        </>
      </Section>

      {/* Section 4 — Members */}
      <Section title={`Members (${memberCount})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Name', 'Email', 'Tier', 'Points', 'Visits', 'Last Visit', 'Status'].map(h => (
                  <th key={h} className="text-left pb-2 pr-4 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {members.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">No members yet</td></tr>
              ) : members.map(m => (
                <tr key={m.id}>
                  <td className="py-2 pr-4 text-slate-300">{m.name || '—'}</td>
                  <td className="py-2 pr-4 text-slate-400">{m.email || '—'}</td>
                  <td className="py-2 pr-4 text-slate-300 capitalize">{m.tier}</td>
                  <td className="py-2 pr-4 text-slate-300">{m.points?.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-slate-300">{m.total_visits}</td>
                  <td className="py-2 pr-4 text-slate-500">{m.last_visit_at ? new Date(m.last_visit_at).toLocaleDateString() : '—'}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${m.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-400'}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Section 5 — Campaigns */}
      <Section title="Campaigns">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Name', 'Type', 'Status', 'Recipients', 'Sent'].map(h => (
                  <th key={h} className="text-left pb-2 pr-4 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {campaigns.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500">No campaigns yet</td></tr>
              ) : campaigns.map(c => (
                <tr key={c.id}>
                  <td className="py-2 pr-4 text-slate-300">{c.name}</td>
                  <td className="py-2 pr-4 text-slate-400 capitalize">{c.type}</td>
                  <td className="py-2 pr-4">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/15 text-slate-300 capitalize">{c.status}</span>
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{c.recipient_count ?? '—'}</td>
                  <td className="py-2 pr-4 text-slate-500">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Section 6 — Activity log */}
      <Section title="Activity Log">
        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No admin actions for this tenant</p>
          ) : events.map(e => (
            <div key={e.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#7c3aed]/15 text-[#a78bfa]">
                  {e.action_type}
                </span>
                <span className="text-xs text-slate-400">
                  by {e.super_admins?.full_name || e.super_admins?.email || 'unknown'}
                </span>
              </div>
              <span className="text-xs text-slate-500">{new Date(e.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
