'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, UserPlus, CheckCircle } from 'lucide-react';
import { LimitWarningBanner } from '../../../components/dashboard/LimitWarningBanner';
import { canAddMember } from '../../../lib/plans/features';
import type { Plan } from '../../../lib/plans/features';

// TODO: replace with real tenant plan from session/context
const TENANT_PLAN: Plan = 'starter';
const MOCK_MEMBER_COUNT = 5;

const mockMembers = [
  { id: '1', name: 'Maria Garcia', email: 'maria@email.com', memberCode: 'SPA-00284', points: 1250, tier: 'silver', status: 'active', lastVisit: '2024-03-15' },
  { id: '2', name: 'Carlos Rodriguez', email: 'carlos@email.com', memberCode: 'SPA-00156', points: 4200, tier: 'gold', status: 'active', lastVisit: '2024-03-14' },
  { id: '3', name: 'Ana Martinez', email: 'ana@email.com', memberCode: 'SPA-00312', points: 450, tier: 'bronze', status: 'active', lastVisit: '2024-03-10' },
  { id: '4', name: 'Juan Lopez', email: 'juan@email.com', memberCode: 'SPA-00098', points: 8900, tier: 'platinum', status: 'active', lastVisit: '2024-03-12' },
  { id: '5', name: 'Laura Sanchez', email: 'laura@email.com', memberCode: 'SPA-00201', points: 2100, tier: 'silver', status: 'inactive', lastVisit: '2024-02-20' },
];

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

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const itemsPerPage = 10;
  
  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.memberCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = !tierFilter || member.tier === tierFilter;
    const matchesStatus = !statusFilter || member.status === statusFilter;
    
    return matchesSearch && matchesTier && matchesStatus;
  });

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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create member');
      }

      setSuccess(true);
      setNewMember({ name: '', email: '', phone: '' });
      
      setTimeout(() => {
        setSuccess(false);
        setIsAddModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const atMemberLimit = !canAddMember(TENANT_PLAN, MOCK_MEMBER_COUNT);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} in your loyalty program
          </p>
        </div>
        <button
          onClick={() => !atMemberLimit && setIsAddModalOpen(true)}
          disabled={atMemberLimit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="h-5 w-5" />
          Add Member
        </button>
      </div>

      {/* Limit warning */}
      <div className="mb-6">
        <LimitWarningBanner plan={TENANT_PLAN} type="members" current={MOCK_MEMBER_COUNT} />
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
          >
            <option value="">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/members/${member.id}`} className="block hover:text-brand-purple">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 font-mono">{member.memberCode}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">{member.points.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${tierColors[member.tier as keyof typeof tierColors]}`}>
                    {member.tier}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[member.status as keyof typeof statusColors]}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.lastVisit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link 
                    href={`/members/${member.id}`}
                    className="text-sm text-brand-purple hover:text-brand-purple-700"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No members found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {filteredMembers.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t">
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">Page {currentPage}</span>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage * itemsPerPage >= filteredMembers.length}
                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
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
                <h3 className="mt-4 text-lg font-medium text-gray-900">Member added!</h3>
                <p className="mt-2 text-sm text-gray-500">The new member has been added to your program.</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Member</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Member'}
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
