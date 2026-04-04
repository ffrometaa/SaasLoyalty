'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePlatformConfig, inviteAdmin } from '@/lib/admin/actions';

function Section({ title = '', sub = '', children = [<></>].slice(0, 0) }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-6">
      <h2 className="text-sm font-semibold text-white mb-0.5">{title}</h2>
      {sub && <p className="text-xs text-slate-500 mb-5">{sub}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label = '', value = '', readOnly = false, type = 'text', onChange = (_v = '') => {} }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={value ?? ''}
        readOnly={readOnly}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        className={`w-full bg-white/[0.04] border border-white/[0.08] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50 ${readOnly ? 'text-slate-500 cursor-default' : 'text-white'}`}
      />
    </div>
  );
}

export function SettingsClient({ admin = { id: '', full_name: '', email: '', last_login_at: null, created_at: '' }, config = { trial_period_days: 14, grace_period_days: 7, points_expiry_days: 365, reactivation_threshold_days: 25, max_payment_retries: 3 } }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Config fields
  const [cfg, setCfg] = useState({
    trial_period_days: config?.trial_period_days ?? 14,
    grace_period_days: config?.grace_period_days ?? 7,
    points_expiry_days: config?.points_expiry_days ?? 365,
    reactivation_threshold_days: config?.reactivation_threshold_days ?? 25,
    max_payment_retries: config?.max_payment_retries ?? 3,
  });

  // Invite admin
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  function saveConfig() {
    setSuccess('');
    setError('');
    startTransition(async () => {
      try {
        await updatePlatformConfig(cfg);
        setSuccess('Configuration saved successfully.');
        router.refresh();
      } catch (e) {
        setError('Failed to save configuration.');
      }
    });
  }

  function sendInvite() {
    if (!inviteEmail) return;
    setSuccess('');
    setError('');
    startTransition(async () => {
      try {
        await inviteAdmin(inviteEmail, inviteName);
        setInviteEmail('');
        setInviteName('');
        setSuccess('Invite sent successfully.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send invite.');
      }
    });
  }

  return (
    <>
      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Section 1 — Admin profile */}
      <Section title="Admin Profile" sub="Your super admin account information">
        <Field label="Full Name" value={admin?.full_name} readOnly />
        <Field label="Email" value={admin?.email} readOnly />
        <Field label="Last Login" value={admin?.last_login_at ? new Date(admin.last_login_at).toLocaleString() : 'Just now'} readOnly />
        <Field label="Account Created" value={admin?.created_at ? new Date(admin.created_at).toLocaleString() : '—'} readOnly />
      </Section>

      {/* Section 2 — Platform configuration */}
      <Section title="Platform Configuration" sub="Global defaults applied across all tenants">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Trial Period (days)</label>
            <input type="number" min={1} max={90} value={cfg.trial_period_days}
              onChange={e => setCfg(c => ({ ...c, trial_period_days: Number(e.target.value) }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Grace Period after Payment Failure (days)</label>
            <input type="number" min={1} max={30} value={cfg.grace_period_days}
              onChange={e => setCfg(c => ({ ...c, grace_period_days: Number(e.target.value) }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Points Expiry Default (days)</label>
            <input type="number" min={30} value={cfg.points_expiry_days}
              onChange={e => setCfg(c => ({ ...c, points_expiry_days: Number(e.target.value) }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Reactivation Trigger Threshold (days)</label>
            <input type="number" min={1} value={cfg.reactivation_threshold_days}
              onChange={e => setCfg(c => ({ ...c, reactivation_threshold_days: Number(e.target.value) }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Max Payment Retries</label>
            <input type="number" min={1} max={10} value={cfg.max_payment_retries}
              onChange={e => setCfg(c => ({ ...c, max_payment_retries: Number(e.target.value) }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50" />
          </div>
        </div>
        <button onClick={saveConfig} disabled={isPending}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">
          {isPending ? 'Saving…' : 'Save Configuration'}
        </button>
      </Section>

      {/* Section 3 — Invite admin */}
      <Section title="Invite Admin" sub="Grant super admin access to another user">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email Address</label>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Full Name (optional)</label>
            <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50" />
          </div>
        </div>
        <button onClick={sendInvite} disabled={isPending || !inviteEmail}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">
          {isPending ? 'Inviting…' : 'Send Invite'}
        </button>
        <p className="text-xs text-slate-500 mt-2">
          The invited admin will be created as inactive until they sign in and their account is manually activated.
        </p>
      </Section>
    </>
  );
}
