'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  AlertTriangle
} from 'lucide-react';

const mockMember = {
  id: '1',
  name: 'Maria Garcia',
  email: 'maria@email.com',
  phone: '+1 234 567 8900',
  memberCode: 'SPA-00284',
  points: 1250,
  pointsLifetime: 1250,
  tier: 'silver',
  status: 'active',
  visitsTotal: 12,
  lastVisit: '2024-03-15',
  acceptsEmail: true,
  acceptsPush: false,
  createdAt: '2024-01-10',
  transactions: [
    { id: '1', type: 'earn', points: 150, balance_after: 1250, description: 'Purchase: $150.00', created_at: '2024-03-15' },
    { id: '2', type: 'redeem', points: -500, balance_after: 1100, description: 'Redeemed: 10% Off', created_at: '2024-03-01' },
    { id: '3', type: 'earn', points: 200, balance_after: 1600, description: 'Purchase: $200.00', created_at: '2024-02-28' },
    { id: '4', type: 'earn', points: 100, balance_after: 1400, description: 'Purchase: $100.00', created_at: '2024-02-15' },
    { id: '5', type: 'bonus', points: 300, balance_after: 1300, description: 'Referral bonus', created_at: '2024-02-01' },
  ],
};

const tierColors = {
  bronze: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  silver: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400' },
  platinum: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
};

const tierEmojis = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

const tierThresholds = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
};

const nextTier = {
  bronze: 'silver',
  silver: 'gold',
  gold: 'platinum',
  platinum: null,
};

const transactionIcons = {
  earn: { icon: Plus, color: 'text-green-600', bg: 'bg-green-100' },
  redeem: { icon: Minus, color: 'text-red-600', bg: 'bg-red-100' },
  bonus: { icon: Gift, color: 'text-brand-purple', bg: 'bg-brand-purple-100' },
  expire: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  refund: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  adjustment: { icon: Edit, color: 'text-blue-600', bg: 'bg-blue-100' },
};

export default function MemberDetailPage() {
  const params = useParams();
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [visitAmount, setVisitAmount] = useState('');
  const [adjustmentPoints, setAdjustmentPoints] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [loading, setLoading] = useState(false);

  const member = mockMember; // In real app, fetch from API
  const tierStyle = tierColors[member.tier as keyof typeof tierColors];
  const nextTierValue = nextTier[member.tier as keyof typeof nextTier];
  const progressToNext = nextTierValue
    ? ((member.pointsLifetime - tierThresholds[member.tier as keyof typeof tierThresholds]) / 
       (tierThresholds[nextTierValue as keyof typeof tierThresholds] - tierThresholds[member.tier as keyof typeof tierThresholds])) * 100
    : 100;

  const handleRegisterVisit = async () => {
    setLoading(true);
    // TODO: Call API
    console.log('Registering visit:', visitAmount);
    setTimeout(() => {
      setLoading(false);
      setIsVisitModalOpen(false);
      setVisitAmount('');
    }, 1000);
  };

  const handleAdjustment = async () => {
    setLoading(true);
    // TODO: Call API
    console.log('Adjustment:', { adjustmentType, adjustmentPoints, adjustmentReason });
    setTimeout(() => {
      setLoading(false);
      setIsAdjustmentModalOpen(false);
      setAdjustmentPoints('');
      setAdjustmentReason('');
    }, 1000);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Back button */}
      <Link 
        href="/members" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Members
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Member info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
                <p className="text-gray-500 mt-1">{member.memberCode}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${tierStyle.bg} ${tierStyle.text}`}>
                {tierEmojis[member.tier as keyof typeof tierEmojis]} {member.tier}
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
                <span>Member since {member.createdAt}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  member.status === 'active' ? 'bg-green-100 text-green-800' :
                  member.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {member.status === 'active' && <CheckCircle className="inline h-3 w-3 mr-1" />}
                  {member.status === 'blocked' && <Ban className="inline h-3 w-3 mr-1" />}
                  {member.status}
                </span>
                <button className="text-sm text-brand-purple hover:text-brand-purple-700">
                  <Edit className="inline h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* Points Card */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-sm font-medium text-gray-500">Points Balance</h2>
            <p className="text-4xl font-bold text-brand-purple mt-2">
              {member.points.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {member.pointsLifetime.toLocaleString()} lifetime points
            </p>

            {/* Tier Progress */}
            {nextTierValue && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress to {nextTierValue}</span>
                  <span className="font-medium">
                    {tierThresholds[nextTierValue as keyof typeof tierThresholds] - member.pointsLifetime} pts to go
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-purple rounded-full transition-all"
                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{member.visitsTotal}</p>
                <p className="text-sm text-gray-500">Total Visits</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Last Visit</p>
                <p className="text-lg font-medium text-gray-900">{member.lastVisit}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsVisitModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-5 w-5" />
                Register Visit
              </button>
              <button
                onClick={() => setIsAdjustmentModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Edit className="h-5 w-5" />
                Add Adjustment
              </button>
              {member.status === 'active' ? (
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                  <Ban className="h-5 w-5" />
                  Block Member
                </button>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50">
                  <CheckCircle className="h-5 w-5" />
                  Unblock Member
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            </div>
            <div className="divide-y">
              {member.transactions.map((tx) => {
                const txStyle = transactionIcons[tx.type as keyof typeof transactionIcons] || transactionIcons.earn;
                const Icon = txStyle.icon;
                
                return (
                  <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${txStyle.bg}`}>
                        <Icon className={`h-5 w-5 ${txStyle.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tx.description}</p>
                        <p className="text-sm text-gray-500">{tx.created_at}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Balance: {tx.balance_after.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {member.transactions.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Gift className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">No transactions yet</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Register Visit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Amount ($)
                </label>
                <input
                  type="number"
                  value={visitAmount}
                  onChange={(e) => setVisitAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Points per dollar</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Points to earn</span>
                  <span className="font-bold text-green-600">
                    +{visitAmount ? Math.floor(parseFloat(visitAmount) * 1) : 0}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsVisitModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterVisit}
                  disabled={!visitAmount || loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Register'}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Adjustment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="adjustmentType"
                      checked={adjustmentType === 'add'}
                      onChange={() => setAdjustmentType('add')}
                      className="text-brand-purple"
                    />
                    <span>Add Points</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="adjustmentType"
                      checked={adjustmentType === 'subtract'}
                      onChange={() => setAdjustmentType('subtract')}
                      className="text-brand-purple"
                    />
                    <span>Subtract Points</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  value={adjustmentPoints}
                  onChange={(e) => setAdjustmentPoints(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a reason</option>
                  <option value="correction">Correction</option>
                  <option value="refund">Refund</option>
                  <option value="bonus">Special Bonus</option>
                  <option value="complaint">Service Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustment}
                  disabled={!adjustmentPoints || !adjustmentReason || loading}
                  className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
