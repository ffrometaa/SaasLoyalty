'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Gift, Edit, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SectionErrorBoundary } from '../../../components/SectionErrorBoundary';

type Reward = {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  redemption_count: number;
  is_active: boolean;
  max_redemptions: number | null;
  valid_until: string | null;
  created_at: string;
};

export default function RewardsPage() {
  const t = useTranslations('rewards');

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    setInitialLoading(true);
    try {
      const res = await fetch('/api/rewards');
      if (res.ok) {
        const data = await res.json();
        setRewards(data.rewards || []);
      } else {
        setError('Failed to load rewards');
      }
    } catch {
      setError('Failed to load rewards');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await loadRewards();
        setIsCreateModalOpen(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create reward');
      }
    } catch {
      setError('Failed to create reward');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rewards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await loadRewards();
        setEditingReward(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update reward');
      }
    } catch {
      setError('Failed to update reward');
    } finally {
      setLoading(false);
    }
  };

  const filteredRewards = rewards.filter(reward => {
    if (filter === 'active') return reward.is_active;
    if (filter === 'inactive') return !reward.is_active;
    return true;
  });

  const handleToggleActive = async (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (reward) {
      await handleUpdate(id, { is_active: !reward.is_active });
    }
  };

  const activeCount = rewards.filter(r => r.is_active).length;
  const inactiveCount = rewards.filter(r => !r.is_active).length;

  return (
    <SectionErrorBoundary section="Recompensas">
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
      {initialLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRewards.map((reward) => (
          <div
            key={reward.id}
            className={`bg-white rounded-xl border overflow-hidden transition-all ${
              !reward.is_active ? 'opacity-60 bg-gray-50' : 'hover:shadow-lg'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${
                  reward.is_active ? 'bg-brand-purple-100' : 'bg-gray-100'
                }`}>
                  <Gift className={`h-6 w-6 ${reward.is_active ? 'text-brand-purple' : 'text-gray-400'}`} />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(reward.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      reward.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={reward.is_active ? t('deactivate') : t('activate')}
                  >
                    {reward.is_active ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
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
                <span className="text-2xl font-bold text-brand-purple">{reward.points_required.toLocaleString()}</span>
                <span className="text-gray-500">{t('points')}</span>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {reward.redemption_count} {t('redeemed')}
                </span>
                {reward.redemption_count > 0 && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {t('popular')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Empty State */}
      {!initialLoading && filteredRewards.length === 0 && (
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
    </SectionErrorBoundary>
  );
}

// Reward Modal Component
function RewardModal({
  reward,
  onClose,
  onSubmit,
  loading
}: {
  reward: Reward | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const t = useTranslations('rewards');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState({
    name: reward?.name || '',
    description: reward?.description || '',
    points_required: reward?.points_required || '',
    max_redemptions: '',
    valid_until: '',
    is_active: reward?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description || null,
      points_required: parseInt(String(formData.points_required)),
      max_redemptions: formData.max_redemptions ? parseInt(String(formData.max_redemptions)) : null,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
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
              value={formData.points_required}
              onChange={(e) => setFormData(prev => ({ ...prev, points_required: e.target.value }))}
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
                value={formData.max_redemptions}
                onChange={(e) => setFormData(prev => ({ ...prev, max_redemptions: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                placeholder={t('maxRedemptionsPlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('leaveEmptyUnlimited')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('validUntil')}</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_active ? 'bg-brand-purple' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <label className="text-sm text-gray-700">
              {formData.is_active ? t('activeVisible') : t('inactiveHidden')}
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
