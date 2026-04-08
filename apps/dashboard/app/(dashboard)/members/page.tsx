'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ChevronLeft, ChevronRight, UserPlus, CheckCircle,
  Upload, Users, FileText, Link2, Send, Download,
  Coins, Megaphone, X, Minus, Plus,
} from 'lucide-react';
import { LimitWarningBanner } from '../../../components/dashboard/LimitWarningBanner';
import { SectionErrorBoundary } from '../../../components/SectionErrorBoundary';
import { canAddMember } from '../../../lib/plans/features';
import type { Plan } from '../../../lib/plans/features';
import { useTranslations } from 'next-intl';

const tierColors = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-100 text-gray-800',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800',
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  blocked: 'bg-red-100 text-red-800',
};

type Member = {
  id: string;
  name: string;
  email: string;
  member_code: string;
  points_balance: number;
  tier: string;
  status: string;
  last_visit_at: string | null;
  auth_user_id: string | null;
};

export default function MembersPage() {
  const t = useTranslations('members');
  const tCommon = useTranslations('common');

  const [members, setMembers] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [tenantPlan, setTenantPlan] = useState<Plan>('starter');
  const [pageLoading, setPageLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdjustPointsOpen, setIsAdjustPointsOpen] = useState(false);
  const [isQuickBlastOpen, setIsQuickBlastOpen] = useState(false);

  // Add member form
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', sendInvite: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Import
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  // Invite
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  // Bulk: adjust points
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustResult, setAdjustResult] = useState<{ affected: number } | null>(null);

  // Bulk: quick blast
  const [blastSubject, setBlastSubject] = useState('');
  const [blastMessage, setBlastMessage] = useState('');
  const [blastChannel, setBlastChannel] = useState<'email' | 'push' | 'both'>('both');
  const [blastLoading, setBlastLoading] = useState(false);
  const [blastResult, setBlastResult] = useState<{ emailSent: number; pushSent: number } | null>(null);

  const itemsPerPage = 20;

  const fetchMembers = useCallback(async (page = currentPage, search = searchQuery) => {
    setPageLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(itemsPerPage),
      });
      if (search) params.set('search', search);
      if (tierFilter) params.set('tier', tierFilter);
      if (statusFilter) params.set('status', statusFilter);

      const [membersRes, tenantRes] = await Promise.all([
        fetch(`/api/members?${params}`),
        fetch('/api/tenant/me'),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members ?? []);
        setTotalMembers(data.pagination?.total ?? 0);
      }
      if (tenantRes.ok) {
        const data = await tenantRes.json();
        setTenantPlan(data.plan ?? 'starter');
      }
    } finally {
      setPageLoading(false);
    }
  }, [currentPage, searchQuery, tierFilter, statusFilter]);

  useEffect(() => {
    fetchMembers(currentPage, searchQuery);
    setSelectedIds(new Set());
  }, [currentPage, tierFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchMembers(1, searchQuery);
      setSelectedIds(new Set());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Selection helpers ────────────────────────────────────────────────────────
  const allOnPageSelected = members.length > 0 && members.every(m => selectedIds.has(m.id));
  const someOnPageSelected = members.some(m => selectedIds.has(m.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        members.forEach(m => next.delete(m.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        members.forEach(m => next.add(m.id));
        return next;
      });
    }
  };

  const toggleMember = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedCount = selectedIds.size;
  const selectedMembersList = members.filter(m => selectedIds.has(m.id));

  // ── CSV export (client-side) ─────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = selectedMembersList.length > 0 ? selectedMembersList : members;
    const headers = ['name', 'email', 'member_code', 'tier', 'status', 'points_balance', 'last_visit_at'];
    const csv = [
      headers.join(','),
      ...rows.map(m =>
        [
          `"${m.name.replace(/"/g, '""')}"`,
          `"${m.email}"`,
          m.member_code,
          m.tier,
          m.status,
          m.points_balance,
          m.last_visit_at ?? '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Bulk: adjust points ──────────────────────────────────────────────────────
  const handleAdjustPoints = async () => {
    if (!adjustAmount || !adjustReason.trim()) return;
    setAdjustLoading(true);
    try {
      const res = await fetch('/api/members/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_points',
          memberIds: Array.from(selectedIds),
          amount: adjustAmount,
          reason: adjustReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdjustResult({ affected: data.affected });
      fetchMembers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdjustLoading(false);
    }
  };

  const closeAdjustPoints = () => {
    setIsAdjustPointsOpen(false);
    setAdjustAmount(0);
    setAdjustReason('');
    setAdjustResult(null);
  };

  // ── Bulk: quick blast ────────────────────────────────────────────────────────
  const handleQuickBlast = async () => {
    if (!blastSubject.trim() || !blastMessage.trim()) return;
    setBlastLoading(true);
    try {
      const res = await fetch('/api/members/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick_blast',
          memberIds: Array.from(selectedIds),
          subject: blastSubject,
          message: blastMessage,
          channel: blastChannel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBlastResult({ emailSent: data.emailSent, pushSent: data.pushSent });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBlastLoading(false);
    }
  };

  const closeQuickBlast = () => {
    setIsQuickBlastOpen(false);
    setBlastSubject('');
    setBlastMessage('');
    setBlastChannel('both');
    setBlastResult(null);
  };

  // ── Add member ───────────────────────────────────────────────────────────────
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create member');
      setSuccess(true);
      setNewMember({ name: '', email: '', phone: '', sendInvite: false });
      setTimeout(() => {
        setSuccess(false);
        setIsAddModalOpen(false);
        fetchMembers();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Import ───────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importText.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/members/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: importText,
      });
      const data = await res.json();
      setImportResult(data);
      if (data.imported > 0) fetchMembers();
    } catch {
      setImportResult({ imported: 0, skipped: 0, errors: ['Connection error'] });
    } finally {
      setImportLoading(false);
    }
  };

  // ── Invite ───────────────────────────────────────────────────────────────────
  const handleInvite = async (memberId: string) => {
    setInvitingId(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}/invite`, { method: 'POST' });
      if (res.ok) setInvitedIds(prev => new Set(prev).add(memberId));
    } finally {
      setInvitingId(null);
    }
  };

  const atMemberLimit = !canAddMember(tenantPlan, totalMembers);
  const totalPages = Math.ceil(totalMembers / itemsPerPage);

  return (
    <SectionErrorBoundary section="Miembros">
    <div className="p-6 lg:p-8 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('subtitle', { count: totalMembers, plural: totalMembers !== 1 ? 's' : '' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={selectedCount > 0 ? `Export ${selectedCount} selected` : 'Export current page'}
          >
            <Download className="h-4 w-4" />
            {selectedCount > 0 ? `Export (${selectedCount})` : 'Export CSV'}
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-5 w-5" />
            Import CSV
          </button>
          <button
            onClick={() => !atMemberLimit && setIsAddModalOpen(true)}
            disabled={atMemberLimit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-5 w-5" />
            {t('addMember')}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <LimitWarningBanner plan={tenantPlan} type="members" current={totalMembers} />
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
          >
            <option value="">{t('allTiers')}</option>
            <option value="bronze">{t('bronze')}</option>
            <option value="silver">{t('silver')}</option>
            <option value="gold">{t('gold')}</option>
            <option value="platinum">{t('platinum')}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
          >
            <option value="">{t('allStatus')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
            <option value="blocked">{t('blocked')}</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {pageLoading ? (
          <div className="px-6 py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent mx-auto" />
            <p className="mt-4 text-sm text-gray-500">{t('loadingList')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        ref={el => { if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected; }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-brand-purple rounded border-gray-300 focus:ring-brand-purple cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('memberCode')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('points')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tier')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lastVisit')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className={`hover:bg-gray-50 ${selectedIds.has(member.id) ? 'bg-purple-50' : ''}`}
                    >
                      <td className="w-10 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(member.id)}
                          onChange={() => toggleMember(member.id)}
                          className="h-4 w-4 text-brand-purple rounded border-gray-300 focus:ring-brand-purple cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 font-mono">{member.member_code}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{member.points_balance.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${tierColors[member.tier as keyof typeof tierColors] ?? 'bg-gray-100 text-gray-800'}`}>
                          {member.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[member.status as keyof typeof statusColors] ?? 'bg-gray-100 text-gray-800'}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.auth_user_id ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Activa</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">Sin cuenta</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.last_visit_at ? new Date(member.last_visit_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          {!member.auth_user_id && !invitedIds.has(member.id) && (
                            <button
                              onClick={() => handleInvite(member.id)}
                              disabled={invitingId === member.id}
                              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-purple disabled:opacity-50 transition-colors"
                              title="Enviar invitación"
                            >
                              <Send className="h-3.5 w-3.5" />
                              {invitingId === member.id ? 'Enviando...' : 'Invitar'}
                            </button>
                          )}
                          {invitedIds.has(member.id) && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Enviado
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {members.length === 0 && !pageLoading && (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No members yet</h3>
                <p className="text-sm text-gray-500 mb-8">Add your first members using any of these methods:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserPlus className="h-5 w-5 text-brand-purple" />
                      <span className="text-sm font-medium text-gray-900">Manual</span>
                    </div>
                    <p className="text-xs text-gray-500">Add members one by one with the + button above</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-brand-purple" />
                      <span className="text-sm font-medium text-gray-900">Import CSV</span>
                    </div>
                    <p className="text-xs text-gray-500">Upload a list of existing members in bulk</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="h-5 w-5 text-brand-purple" />
                      <span className="text-sm font-medium text-gray-900">Join Link</span>
                    </div>
                    <p className="text-xs text-gray-500">Share your Join Link from Settings &gt; Integrations so members can join themselves</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t">
                <p className="text-sm text-gray-500">
                  {t('showing', { from: ((currentPage - 1) * itemsPerPage) + 1, to: Math.min(currentPage * itemsPerPage, totalMembers), total: totalMembers })}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-600">{t('pageOf', { current: currentPage, total: totalPages })}</span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Floating Bulk Action Bar ─────────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-gray-900 text-white rounded-xl shadow-xl px-4 py-3 text-sm font-medium">
          <span className="text-gray-300 mr-1">{selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}</span>
          <div className="w-px h-5 bg-gray-600 mx-1" />
          <button
            onClick={() => setIsAdjustPointsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Coins className="h-4 w-4" />
            Ajustar puntos
          </button>
          <button
            onClick={() => setIsQuickBlastOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Megaphone className="h-4 w-4" />
            Enviar mensaje
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <button
            onClick={clearSelection}
            className="ml-1 p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
            title="Deseleccionar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Modal: Adjust Points ─────────────────────────────────────────────── */}
      {isAdjustPointsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeAdjustPoints} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            {adjustResult ? (
              <div className="text-center py-4">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Puntos ajustados</h3>
                <p className="text-sm text-gray-500 mt-1">{adjustResult.affected} miembro{adjustResult.affected !== 1 ? 's' : ''} actualizado{adjustResult.affected !== 1 ? 's' : ''}.</p>
                <button onClick={closeAdjustPoints} className="mt-6 w-full px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700">
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Ajustar puntos</h2>
                <p className="text-sm text-gray-500 mb-5">{selectedCount} miembro{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}.</p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de puntos</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAdjustAmount(v => v - 10)}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                      className="flex-1 text-center px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple text-lg font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setAdjustAmount(v => v + 10)}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    {adjustAmount > 0 ? `+${adjustAmount} puntos a cada miembro` : adjustAmount < 0 ? `${adjustAmount} puntos a cada miembro (mínimo 0)` : 'Sin cambio'}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Ej: Promoción de temporada, corrección manual..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeAdjustPoints}
                    disabled={adjustLoading}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAdjustPoints}
                    disabled={adjustLoading || adjustAmount === 0 || !adjustReason.trim()}
                    className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adjustLoading ? 'Ajustando...' : 'Confirmar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Quick Blast ───────────────────────────────────────────────── */}
      {isQuickBlastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeQuickBlast} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            {blastResult ? (
              <div className="text-center py-4">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Mensaje enviado</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  {blastResult.emailSent > 0 && <p>{blastResult.emailSent} email{blastResult.emailSent !== 1 ? 's' : ''} enviado{blastResult.emailSent !== 1 ? 's' : ''}</p>}
                  {blastResult.pushSent > 0 && <p>{blastResult.pushSent} push enviado{blastResult.pushSent !== 1 ? 's' : ''}</p>}
                </div>
                <button onClick={closeQuickBlast} className="mt-6 w-full px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700">
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Enviar mensaje</h2>
                <p className="text-sm text-gray-500 mb-5">A {selectedCount} miembro{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}.</p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                  <div className="flex gap-2">
                    {(['email', 'push', 'both'] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setBlastChannel(ch)}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${blastChannel === ch ? 'border-brand-purple bg-purple-50 text-brand-purple font-medium' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                      >
                        {ch === 'both' ? 'Email + Push' : ch.charAt(0).toUpperCase() + ch.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asunto <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={blastSubject}
                    onChange={(e) => setBlastSubject(e.target.value)}
                    placeholder="Ej: ¡Oferta exclusiva para vos!"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje <span className="text-red-500">*</span></label>
                  <textarea
                    rows={4}
                    value={blastMessage}
                    onChange={(e) => setBlastMessage(e.target.value)}
                    placeholder="Escribí tu mensaje aquí..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeQuickBlast}
                    disabled={blastLoading}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickBlast}
                    disabled={blastLoading || !blastSubject.trim() || !blastMessage.trim()}
                    className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {blastLoading ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: CSV Import ────────────────────────────────────────────────── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !importLoading && (setIsImportModalOpen(false), setImportText(''), setImportResult(null))} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Import Members from CSV</h2>
            <p className="text-sm text-gray-500 mb-4">
              Paste your CSV below. First row must be the header:{' '}
              <code className="bg-gray-100 px-1 rounded text-xs font-mono">name,email,phone</code>{' '}
              (phone is optional)
            </p>

            <textarea
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              disabled={importLoading || !!importResult}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple font-mono text-sm resize-none disabled:bg-gray-50"
              placeholder={"name,email,phone\nJohn Doe,john@example.com,+1234567890"}
            />

            <div className="mt-2 mb-4">
              <a
                href="data:text/plain;charset=utf-8,name%2Cemail%2Cphone%0AJohn%20Doe%2Cjohn%40example.com%2C%2B1234567890"
                download="members-template.csv"
                className="text-xs text-brand-purple hover:underline"
              >
                Download sample template
              </a>
            </div>

            {importResult ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  {importResult.imported} member{importResult.imported !== 1 ? 's' : ''} imported successfully
                </div>
                {importResult.skipped > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    {importResult.skipped} row{importResult.skipped !== 1 ? 's' : ''} skipped
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    <p className="font-medium mb-1">Errors:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {importResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => { setIsImportModalOpen(false); setImportText(''); setImportResult(null); }}
                  className="w-full px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsImportModalOpen(false); setImportText(''); setImportResult(null); }}
                  disabled={importLoading}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importLoading || !importText.trim()}
                  className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importLoading ? 'Importing…' : 'Import'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Add Member ────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !loading && setIsAddModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            {success ? (
              <div className="text-center py-6">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">{t('added')}</h3>
                <p className="mt-2 text-sm text-gray-500">{t('addedDesc')}</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('addMemberTitle')}</h2>
                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')} <span className="text-red-500">*</span></label>
                    <input type="text" required value={newMember.name} onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple" placeholder={t('namePlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')} <span className="text-red-500">*</span></label>
                    <input type="email" required value={newMember.email} onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple" placeholder={t('emailPlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                    <input type="tel" value={newMember.phone} onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple" placeholder={t('phonePlaceholder')} />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <input type="checkbox" id="sendInvite" checked={newMember.sendInvite} onChange={(e) => setNewMember(prev => ({ ...prev, sendInvite: e.target.checked }))} className="h-4 w-4 text-brand-purple rounded border-gray-300 focus:ring-brand-purple" />
                    <label htmlFor="sendInvite" className="text-sm text-gray-700 cursor-pointer select-none">Enviar invitación por email al miembro</label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={loading} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">{tCommon('cancel')}</button>
                    <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 disabled:opacity-50">{loading ? t('adding') : t('addMember')}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </SectionErrorBoundary>
  );
}
