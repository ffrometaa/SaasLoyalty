'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, UserPlus, CheckCircle } from 'lucide-react';
import { LimitWarningBanner } from '../../../components/dashboard/LimitWarningBanner';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '' });

  const itemsPerPage = 20;

  const fetchMembers = async () => {
    setPageLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      });
      if (searchQuery) params.set('search', searchQuery);
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
  };

  useEffect(() => {
    fetchMembers();
  }, [currentPage, tierFilter, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchMembers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      setNewMember({ name: '', email: '', phone: '' });

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

  const atMemberLimit = !canAddMember(tenantPlan, totalMembers);
  const totalPages = Math.ceil(totalMembers / itemsPerPage);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('subtitle', { count: totalMembers, plural: totalMembers !== 1 ? 's' : '' })}
          </p>
        </div>
        <button
          onClick={() => !atMemberLimit && setIsAddModalOpen(true)}
          disabled={atMemberLimit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="h-5 w-5" />
          {t('addMember')}
        </button>
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('memberCode')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('points')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tier')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lastVisit')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/members/${member.id}`} className="block hover:text-brand-purple">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </Link>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.last_visit_at ? new Date(member.last_visit_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/members/${member.id}`}
                        className="text-sm text-brand-purple hover:text-brand-purple-700"
                      >
                        {t('viewMember')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {members.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">{t('noMembersFound')}</p>
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

      {/* Add Member Modal */}
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

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                )}

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('name')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      placeholder={t('namePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('email')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      placeholder={t('emailPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      placeholder={t('phonePlaceholder')}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      {tCommon('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 disabled:opacity-50"
                    >
                      {loading ? t('adding') : t('addMember')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
