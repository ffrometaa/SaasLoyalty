'use client';

import { useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import type React from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Gift,
  Plus,
  Minus,
  Edit,
  Ban,
  CheckCircle,
  AlertTriangle,
  X,
  Send,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SectionErrorBoundary } from '../../../../components/SectionErrorBoundary';

interface Transaction {
  id: string;
  type: string;
  points: number;
  points_balance: number;
  description: string;
  created_at: string;
}

export interface MemberDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  member_code: string;
  points_balance: number;
  points_lifetime: number;
  tier: string;
  status: string;
  visits_total: number;
  last_visit_at: string | null;
  accepts_email: boolean;
  accepts_push: boolean;
  birthday: string | null;
  auth_user_id: string | null;
  created_at: string;
  transactions: Transaction[];
  top_rewards?: { name: string; count: number }[];
}

const tierColors = {
  bronze: { bg: 'bg-amber-100', text: 'text-amber-800' },
  silver: { bg: 'bg-gray-100', text: 'text-gray-800' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  platinum: { bg: 'bg-purple-100', text: 'text-purple-800' },
};

const tierEmojis: Record<string, string> = {
  bronze: '\u{1F949}', silver: '\u{1F948}', gold: '\u{1F947}', platinum: '\u{1F48E}',
};

const tierThresholds: Record<string, number> = {
  bronze: 0, silver: 1000, gold: 5000, platinum: 10000,
};

const nextTierMap: Record<string, string | null> = {
  bronze: 'silver', silver: 'gold', gold: 'platinum', platinum: null,
};

const transactionStyles: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  earn: { icon: Plus, color: 'text-green-600', bg: 'bg-green-100' },
  redeem: { icon: Minus, color: 'text-red-600', bg: 'bg-red-100' },
  bonus: { icon: Gift, color: 'text-brand-purple', bg: 'bg-brand-purple-100' },
  expire: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  adjustment: { icon: Edit, color: 'text-blue-600', bg: 'bg-blue-100' },
  refund: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
};

interface Props {
  initialMember: MemberDetail | null;
  memberId: string;
}

function progressWidthClass(pct: number): string {
  const p = Math.min(100, Math.round(pct));
  if (p >= 100) return 'w-full';
  if (p >= 88) return 'w-11/12';
  if (p >= 75) return 'w-3/4';
  if (p >= 63) return 'w-2/3';
  if (p >= 50) return 'w-1/2';
  if (p >= 38) return 'w-5/12';
  if (p >= 25) return 'w-1/4';
  if (p >= 13) return 'w-1/6';
  return 'w-1/12';
}

export function MemberDetailPageClient({ initialMember, memberId }: Props): JSX.Element {
  const t = useTranslations('members');
  const tCommon = useTranslations('common');

  const id = memberId;

  const [member, setMember] = useState<MemberDetail | null>(initialMember);
  const [pageError, setPageError] = useState<string | null>(initialMember ? null : 'Member not found');

  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [visitAmount, setVisitAmount] = useState('');
  const [adjustmentPoints, setAdjustmentPoints] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [editForm, setEditForm] = useState({
    name: initialMember?.name ?? '',
    email: initialMember?.email ?? '',
    phone: initialMember?.phone ?? '',
    birthday: initialMember?.birthday ?? '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const fetchMember = async (): Promise<void> => {
    try {
      const res = await fetch(`/api/members/${id}`);
      if (!res.ok) throw new Error('Member not found');
      const data = await res.json() as { member: MemberDetail };
      const m: MemberDetail = {
        ...data.member,
        transactions: [...(data.member.transactions ?? [])].sort(
          (a: Transaction, b: Transaction) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      };
      setMember(m);
      setEditForm({ name: m.name, email: m.email, phone: m.phone ?? '', birthday: m.birthday ?? '' });
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const handleRegisterVisit = async (): Promise<void> => {
    if (!visitAmount) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/members/${id}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(visitAmount) }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to register visit');
      setIsVisitModalOpen(false);
      setVisitAmount('');
      await fetchMember();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustment = async (): Promise<void> => {
    if (!adjustmentPoints || !adjustmentReason) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/members/${id}/adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: adjustmentType,
          points: parseInt(adjustmentPoints),
          reason: adjustmentReason,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to apply adjustment');
      setIsAdjustmentModalOpen(false);
      setAdjustmentPoints('');
      setAdjustmentReason('');
      await fetchMember();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlock = async (): Promise<void> => {
    if (!member) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const newStatus = member.status === 'blocked' ? 'active' : 'blocked';
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to update member');
      await fetchMember();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone || null,
          birthday: editForm.birthday || null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to update member');
      setIsEditModalOpen(false);
      await fetchMember();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvite = async (): Promise<void> => {
    setInviteLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/members/${id}/invite`, { method: 'POST' });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to send invitation');
      setInviteSent(true);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setInviteLoading(false);
    }
  };

  if (pageError || !member) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/members" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-5 w-5" />
          {t('backToMembers')}
        </Link>
        <div className="bg-red-50 rounded-xl p-6 text-center">
          <p className="text-red-700">{pageError ?? t('memberNotFound')}</p>
        </div>
      </div>
    );
  }


  const getDaysSinceLastVisit = (): number | null => {
    if (!member.last_visit_at) return null;
    const diff = new Date().getTime() - new Date(member.last_visit_at).getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  };
  const daysSince = getDaysSinceLastVisit();
  let daysColorClass = 'text-gray-600';
  if (daysSince !== null) {
    if (daysSince <= 30) daysColorClass = 'text-green-600';
    else if (daysSince <= 90) daysColorClass = 'text-yellow-600';
    else daysColorClass = 'text-red-600';
  }

  const tierStyle = tierColors[member.tier as keyof typeof tierColors] ?? tierColors.bronze;
  const nextTier = nextTierMap[member.tier];
  const progressToNext = nextTier
    ? ((member.points_lifetime - tierThresholds[member.tier]) /
       (tierThresholds[nextTier] - tierThresholds[member.tier])) * 100
    : 100;

  return (
    <SectionErrorBoundary section="Member Detail">
    <div className="p-6 lg:p-8">
      <Link href="/members" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5" />
        {t('backToMembers')}
      </Link>

      {actionError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-between">
          {actionError}
          <button onClick={() => setActionError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
                <p className="text-gray-500 mt-1">{member.member_code}</p>
              </div>
              <span className={clsx('px-3 py-1 text-sm font-medium rounded-full capitalize', tierStyle.bg, tierStyle.text)}>
                {tierEmojis[member.tier] ?? ''} {member.tier}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-5 w-5" />
                <span>{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="h-5 w-5" />
                  <span>{member.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="h-5 w-5" />
                <span>{t('memberSince', { date: new Date(member.created_at).toLocaleDateString() })}</span>
              </div>
              {daysSince !== null && (
                <div className={clsx('flex items-center gap-3 font-medium', daysColorClass)}>
                  <Calendar className="h-5 w-5" />
                  <span>\u00daltima visita: Hace {daysSince} d\u00eda{daysSince !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t flex items-center justify-between">
              <span className={clsx('px-2 py-1 text-xs font-medium rounded', member.status === 'active' ? 'bg-green-100 text-green-800' : member.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}>
                {member.status === 'active' && <CheckCircle className="inline h-3 w-3 mr-1" />}
                {member.status === 'blocked' && <Ban className="inline h-3 w-3 mr-1" />}
                {member.status}
              </span>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-sm text-brand-purple hover:text-brand-purple-700"
              >
                <Edit className="inline h-4 w-4 mr-1" />
                {tCommon('edit')}
              </button>
            </div>
          </div>

          {/* Points Card */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-sm font-medium text-gray-500">{t('pointsBalance')}</h2>
            <p className="text-4xl font-bold text-brand-purple mt-2">
              {member.points_balance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t('lifetimePoints', { count: member.points_lifetime.toLocaleString() })}
            </p>

            {nextTier && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{t('progressTo', { tier: nextTier })}</span>
                  <span className="font-medium">
                    {t('ptsToGo', { count: tierThresholds[nextTier] - member.points_lifetime })}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full bg-brand-purple rounded-full transition-all', progressWidthClass(Math.min(progressToNext, 100)))}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{member.visits_total}</p>
                <p className="text-sm text-gray-500">{t('totalVisits')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('lastVisit')}</p>
                <p className="text-lg font-medium text-gray-900">
                  {member.last_visit_at ? new Date(member.last_visit_at).toLocaleDateString() : '\u2014'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-4">{t('quickActions')}</h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsVisitModalOpen(true)}
                disabled={member.status === 'blocked' || actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
                {t('registerVisit')}
              </button>
              <button
                onClick={() => setIsAdjustmentModalOpen(true)}
                disabled={member.status === 'blocked' || actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit className="h-5 w-5" />
                {t('addAdjustment')}
              </button>
              {member.status !== 'blocked' ? (
                <button
                  onClick={handleToggleBlock}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <Ban className="h-5 w-5" />
                  {t('blockMember')}
                </button>
              ) : (
                <button
                  onClick={handleToggleBlock}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50"
                >
                  <CheckCircle className="h-5 w-5" />
                  {t('unblockMember')}
                </button>
              )}
              {!member.auth_user_id && (
                <button
                  onClick={handleInvite}
                  disabled={inviteLoading || inviteSent}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-brand-purple text-brand-purple rounded-lg hover:bg-brand-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {inviteSent ? t('inviteSent') : inviteLoading ? t('sending') : t('sendInvite')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{t('transactionHistory')}</h2>
            </div>
            <div className="divide-y">
              {member.transactions.map((tx) => {
                const style = transactionStyles[tx.type] ?? transactionStyles.earn;
                const Icon = style.icon;
                return (
                  <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={clsx('p-2 rounded-full', style.bg)}>
                        <Icon className={clsx('h-5 w-5', style.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tx.description}</p>
                        <p className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={clsx('font-bold', tx.points > 0 ? 'text-green-600' : 'text-red-600')}>
                        {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">{t('balanceAfter', { value: tx.points_balance.toLocaleString() })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {member.transactions.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Gift className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">{t('noTransactions')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register Visit Modal */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsVisitModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('visitModalTitle')}</h2>
            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('purchaseAmount')}</label>
                <input
                  type="number"
                  value={visitAmount}
                  onChange={(e) => setVisitAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={t('purchaseAmountPlaceholder')}
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('pointsToEarn')}</span>
                  <span className="font-bold text-green-600">
                    +{visitAmount ? Math.floor(parseFloat(visitAmount)) : 0}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsVisitModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleRegisterVisit}
                  disabled={!visitAmount || actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? tCommon('processing') : tCommon('register')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsAdjustmentModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('adjustmentModalTitle')}</h2>
            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adjustmentType')}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={adjustmentType === 'add'} onChange={() => setAdjustmentType('add')} className="text-brand-purple" />
                    <span>{t('addPoints')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={adjustmentType === 'subtract'} onChange={() => setAdjustmentType('subtract')} className="text-brand-purple" />
                    <span>{t('subtractPoints')}</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adjustmentPoints')}</label>
                <input
                  type="number"
                  value={adjustmentPoints}
                  onChange={(e) => setAdjustmentPoints(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adjustmentReason')}</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">{t('selectReason')}</option>
                  <option value="correction">{t('reasonCorrection')}</option>
                  <option value="refund">{t('reasonRefund')}</option>
                  <option value="bonus">{t('reasonBonus')}</option>
                  <option value="complaint">{t('reasonComplaint')}</option>
                  <option value="other">{t('reasonOther')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleAdjustment}
                  disabled={!adjustmentPoints || !adjustmentReason || actionLoading}
                  className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? tCommon('processing') : tCommon('apply')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('editMemberTitle')}</h2>
            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')} <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple"
                  placeholder={t('phonePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('birthday')}</label>
                <input
                  type="date"
                  value={editForm.birthday}
                  onChange={(e) => setEditForm(p => ({ ...p, birthday: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={actionLoading} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? tCommon('saving') : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </SectionErrorBoundary>
  );
}
