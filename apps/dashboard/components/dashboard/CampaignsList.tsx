'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Campaign } from '../../lib/campaigns/queries';
import {
  sendCampaignNow,
  deleteCampaign,
  duplicateCampaign,
  cancelCampaign,
} from '../../lib/campaigns/actions';

// ─── TYPE ICONS ───────────────────────────────────────────────────────────────

function PushIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function InAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── STATUS PILL ──────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-amber-100 text-amber-700',
  sending: 'bg-blue-100 text-blue-700 animate-pulse',
  sent: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
};

function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

// ─── SEGMENT PILL ─────────────────────────────────────────────────────────────

function SegmentPill({ segment, label }: { segment: string; label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-purple-50 text-brand-purple border border-brand-purple-100">
      {label}
    </span>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <p className="text-gray-800 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ACTIONS DROPDOWN ─────────────────────────────────────────────────────────

function ActionsDropdown({
  campaign,
  onSend,
  onDelete,
  onDuplicate,
  onCancel,
}: {
  campaign: Campaign;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('campaigns');

  const close = () => setOpen(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 z-20 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">
            {campaign.status === 'draft' && (
              <>
                <Link
                  href={`/campaigns/${campaign.id}/edit`}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={close}
                >
                  {t('actionEdit')}
                </Link>
                <button
                  onClick={() => { close(); onSend(campaign.id); }}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  {t('actionSendNow')}
                </button>
                <Link
                  href={`/campaigns/${campaign.id}/edit?schedule=1`}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={close}
                >
                  {t('actionSchedule')}
                </Link>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => { close(); onDuplicate(campaign.id); }}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  {t('actionDuplicate')}
                </button>
                <button
                  onClick={() => { close(); onDelete(campaign.id); }}
                  className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  {t('actionDelete')}
                </button>
              </>
            )}
            {campaign.status === 'scheduled' && (
              <>
                <Link
                  href={`/campaigns/${campaign.id}/edit`}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={close}
                >
                  {t('actionEdit')}
                </Link>
                <button
                  onClick={() => { close(); onCancel(campaign.id); }}
                  className="flex items-center w-full px-4 py-2 text-amber-600 hover:bg-amber-50"
                >
                  {t('actionCancel')}
                </button>
                <button
                  onClick={() => { close(); onDuplicate(campaign.id); }}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  {t('actionDuplicate')}
                </button>
              </>
            )}
            {(campaign.status === 'sent' || campaign.status === 'error') && (
              <>
                <Link
                  href={`/campaigns/${campaign.id}/results`}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={close}
                >
                  {t('actionViewResults')}
                </Link>
                <button
                  onClick={() => { close(); onDuplicate(campaign.id); }}
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  {t('actionDuplicate')}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SEGMENT LABEL MAP ────────────────────────────────────────────────────────

const SEGMENT_LABEL_KEYS: Record<string, string> = {
  all: 'segmentAll',
  active: 'segmentActive',
  at_risk: 'segmentAtRisk',
  inactive: 'segmentInactive',
  tier_bronze: 'segmentTierBronze',
  tier_silver: 'segmentTierSilver',
  tier_gold: 'segmentTierGold',
  tier_platinum: 'segmentTierPlatinum',
  birthday_month: 'segmentBirthdayMonth',
};

// ─── TYPE LABEL MAP ───────────────────────────────────────────────────────────

const TYPE_LABEL_KEYS: Record<string, string> = {
  push: 'typePush',
  email: 'typeEmail',
  sms: 'typeSms',
  inapp: 'typeInapp',
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CampaignsList({
  campaigns,
  statusCounts,
  planLimit,
  currentMonthCount,
}: {
  campaigns: Campaign[];
  statusCounts: Record<string, number>;
  planLimit: number | null;
  currentMonthCount: number;
}) {
  const t = useTranslations('campaigns');
  const [activeTab, setActiveTab] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirm, setConfirm] = useState<{ action: string; campaignId: string } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const limitReached = planLimit !== null && currentMonthCount >= planLimit;

  const tabs = [
    { key: 'all', label: t('tabAll'), count: statusCounts.all ?? 0 },
    { key: 'draft', label: t('tabDraft'), count: statusCounts.draft ?? 0 },
    { key: 'scheduled', label: t('tabScheduled'), count: statusCounts.scheduled ?? 0 },
    { key: 'sent', label: t('tabSent'), count: statusCounts.sent ?? 0 },
  ];

  const filtered = activeTab === 'all'
    ? campaigns
    : campaigns.filter((c) => c.status === activeTab);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSend = (id: string) => setConfirm({ action: 'send', campaignId: id });
  const handleDelete = (id: string) => setConfirm({ action: 'delete', campaignId: id });

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const result = await duplicateCampaign(id);
      if (result.error) showToast('error', result.error);
      else showToast('success', 'Campaign duplicated.');
    });
  };

  const handleCancel = (id: string) => setConfirm({ action: 'cancel', campaignId: id });

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);

    try {
      let result: { error?: string; success?: boolean; sent?: number };
      if (confirm.action === 'send') {
        result = await sendCampaignNow(confirm.campaignId);
        if (result.error) showToast('error', result.error);
        else showToast('success', t('successSent', { count: result.sent ?? 0 }));
      } else if (confirm.action === 'delete') {
        result = await deleteCampaign(confirm.campaignId);
        if (result.error) showToast('error', result.error);
        else showToast('success', 'Campaign deleted.');
      } else if (confirm.action === 'cancel') {
        result = await cancelCampaign(confirm.campaignId);
        if (result.error) showToast('error', result.error);
        else showToast('success', 'Schedule cancelled.');
      }
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTypeIcon = (type: string) => {
    if (type === 'push') return <PushIcon className="h-4 w-4" />;
    if (type === 'email') return <EmailIcon className="h-4 w-4" />;
    return <InAppIcon className="h-4 w-4" />;
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          message={confirm.action === 'delete' ? t('confirmDelete') : confirm.action === 'send' ? t('confirmSendNow', { count: '?' }) : 'Cancel the scheduled send?'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          loading={confirmLoading}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t('subtitle')}</p>
        </div>
        <Link
          href={limitReached ? '#' : '/campaigns/new'}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            limitReached
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-brand-purple text-white hover:bg-brand-purple/90'
          }`}
          onClick={(e) => limitReached && e.preventDefault()}
          title={limitReached ? t('planLimitWarning') : undefined}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('createCampaign')}
        </Link>
      </div>

      {/* Plan Limit Warning */}
      {limitReached && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-3">
          <svg className="h-5 w-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{t('planLimitWarning')}</span>
          <Link href="/settings?tab=billing" className="ml-auto text-amber-700 font-medium underline underline-offset-2">Upgrade</Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-brand-purple text-white' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium">{activeTab === 'all' ? t('noCampaigns') : t('noCampaignsFilter')}</p>
          <p className="text-gray-500 text-sm mt-1">{activeTab === 'all' ? t('noCampaignsDesc') : ''}</p>
          {activeTab === 'all' && !limitReached && (
            <Link href="/campaigns/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-xl text-sm font-medium hover:bg-brand-purple/90">
              {t('createCampaign')}
            </Link>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t('colName')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">{t('colSegment')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t('colStatus')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">{t('colRecipients')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">{t('colOpenRate')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 hidden xl:table-cell">{t('colSentDate')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((campaign) => {
                const segmentKey = SEGMENT_LABEL_KEYS[campaign.segment ?? ''];
                const typeKey = TYPE_LABEL_KEYS[campaign.type];
                const statusKey = `status${campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}` as Parameters<typeof t>[0];

                return (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-brand-purple-50 flex items-center justify-center text-brand-purple flex-shrink-0">
                          {getTypeIcon(campaign.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{campaign.name}</p>
                          <p className="text-xs text-gray-400">{typeKey ? t(typeKey as Parameters<typeof t>[0]) : campaign.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {segmentKey ? (
                        <SegmentPill segment={campaign.segment ?? ''} label={t(segmentKey as Parameters<typeof t>[0])} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={campaign.status} label={t(statusKey)} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">
                      {campaign.recipients_count > 0 ? campaign.recipients_count.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">
                      {campaign.recipients_count > 0
                        ? `${Math.round((campaign.opened_count / campaign.recipients_count) * 100)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs hidden xl:table-cell">
                      {campaign.status === 'scheduled'
                        ? formatDate(campaign.scheduled_at)
                        : formatDate(campaign.sent_at)}
                    </td>
                    <td className="px-4 py-3">
                      <ActionsDropdown
                        campaign={campaign}
                        onSend={handleSend}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onCancel={handleCancel}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
