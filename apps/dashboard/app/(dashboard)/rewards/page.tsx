'use client';

import { useState } from 'react';
import { Plus, MoreVertical, Gift, Edit, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

const mockRewards = [
  { id: '1', name: 'Free Massage (30 min)', description: 'Relaxing full body massage', pointsRequired: 5000, redemptions: 24, isActive: true },
  { id: '2', name: '10% Off Next Visit', description: 'Get 10% off your next service', pointsRequired: 1000, redemptions: 156, isActive: true },
  { id: '3', name: 'Free Product Sample', description: 'Complimentary skincare product', pointsRequired: 2500, redemptions: 89, isActive: true },
  { id: '4', name: 'VIP Treatment', description: 'Premium service experience', pointsRequired: 10000, redemptions: 5, isActive: true },
  { id: '5', name: 'Birthday Special', description: 'Free treatment on birthday month', pointsRequired: 3000, redemptions: 0, isActive: false },
];

export default function RewardsPage() {
  const t = useTranslations('rewards');

  const [rewards, setRewards] = useState(mockRewards);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<typeof mockRewards[0] | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRewards = rewards.filter(reward => {
    if (filter === 'active') return reward.isActive;
    if (filter === 'inactive') return !reward.isActive;
    return true;
  });

  const handleCreate = async (formData: any) => {
    setLoading(true);
    setError(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newReward = {
      id: Date.now().toString(),
      ...formData,
      redemptions: 0,
    };

    setRewards(prev => [newReward, ...prev]);
    setIsCreateModalOpen(false);
    setLoading(false);
  };

  const handleUpdate = async (id: string, updates: any) => {
    setLoading(true);
    setError(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    setEditingReward(null);
    setLoading(false);
  };

  const handleToggleActive = async (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (reward) {
      await handleUpdate(id, { isActive: !reward.isActive });
    }
  };

  const activeCount = rewards.filter(r => r.isActive).length;
  const inactiveCount = rewards.filter(r => !r.isActive).length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('activeInactive', { active: activeCount, inactive: inactiveCount })}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('createReward')}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-brand-purple-100 text-brand-purple-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('all', { count: rewards.length })}
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('active', { count: activeCount })}
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'inactive'
              ? 'bg-gray-200 text-gray-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('inactive', { count: inactiveCount })}
        </button>
      </div>

      {/* Rewards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRewards.map((reward) => (
          <div
            key={reward.id}
            className={`bg-white rounded-xl border overflow-hidden transition-all ${
              !reward.isActive ? 'opacity-60 bg-gray-50' : 'hover:shadow-lg'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${
                  reward.isActive ? 'bg-brand-purple-100' : 'bg-gray-100'
                }`}>
                  <Gift className={`h-6 w-6 ${reward.isActive ? 'text-brand-purple' : 'text-gray-400'}`} />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(reward.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      reward.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={reward.isActive ? t('deactivate') : t('activate')}
                  >
                    {reward.isActive ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => setEditingReward(reward)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">{reward.name}</h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{reward.description}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-brand-purple">{reward.pointsRequired.toLocaleString()}</span>
                <span className="text-gray-500">{t('points')}</span>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {reward.redemptions} {t('redeemed')}
                </span>
                {reward.redemptions > 0 && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {t('popular')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRewards.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Gift className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('noRewardsFound')}</h3>
          <p className="mt-2 text-gray-500">
            {filter !== 'all'
              ? t('noRewardsFilter', { filter })
              : t('createFirstReward')}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-700"
            >
              <Plus className="h-5 w-5" />
              {t('createReward')}
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingReward) && (
        <RewardModal
          reward={editingReward}
          onClose={() => { setIsCreateModalOpen(false); setEditingReward(null); }}
          onSubmit={editingReward
            ? (data) => handleUpdate(editingReward.id, data)
            : handleCreate
          }
          loading={loading}
        />
      )}
    </div>
  );
}

// Reward Modal Component
function RewardModal({
  reward,
  onClose,
  onSubmit,
  loading
}: {
  reward: typeof mockRewards[0] | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const t = useTranslations('rewards');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState({
    name: reward?.name || '',
    description: reward?.description || '',
    pointsRequired: reward?.pointsRequired || '',
    maxRedemptions: '',
    validUntil: '',
    isActive: reward?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description,
      pointsRequired: parseInt(String(formData.pointsRequired)),
      maxRedemptions: formData.maxRedemptions ? parseInt(String(formData.maxRedemptions)) : null,
      validUntil: formData.validUntil || null,
      isActive: formData.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {reward ? t('editReward') : t('createNewReward')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('rewardName')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              placeholder={t('rewardNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              rows={3}
              placeholder={t('descriptionPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pointsRequired')}</label>
            <input
              type="number"
              required
              min="1"
              value={formData.pointsRequired}
              onChange={(e) => setFormData(prev => ({ ...prev, pointsRequired: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              placeholder={t('pointsRequiredPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('maxRedemptions')}</label>
              <input
                type="number"
                min="1"
                value={formData.maxRedemptions}
                onChange={(e) => setFormData(prev => ({ ...prev, maxRedemptions: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                placeholder={t('maxRedemptionsPlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('leaveEmptyUnlimited')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('validUntil')}</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isActive ? 'bg-brand-purple' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <label className="text-sm text-gray-700">
              {formData.isActive ? t('activeVisible') : t('inactiveHidden')}
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? tCommon('saving') : reward ? t('saveChanges') : t('createReward')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
