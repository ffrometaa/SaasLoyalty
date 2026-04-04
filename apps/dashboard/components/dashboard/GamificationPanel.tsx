'use client';

import { useState } from 'react';
import { Trophy, Star, Zap, Target, Award, Plus, Play, Archive, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Challenge, Badge, GamificationSummary } from '@/lib/gamification/queries';
import {
  createChallenge,
  updateChallengeStatus,
  deleteChallenge,
  createBadge,
} from '@/lib/gamification/actions';

interface GamificationPanelProps {
  challenges: Challenge[];
  badges: Badge[];
  summary: GamificationSummary;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-500 bg-gray-100',
  rare: 'text-blue-600 bg-blue-50',
  epic: 'text-purple-600 bg-purple-50',
  legendary: 'text-amber-600 bg-amber-50',
};

const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  visit_count: 'Visit Count',
  points_earned: 'Points Earned',
  referral: 'Referrals',
  spend_amount: 'Amount Spent',
  streak: 'Streak',
};

const CHALLENGE_TYPE_ICONS: Record<string, React.ElementType> = {
  visit_count: Target,
  points_earned: Star,
  referral: Zap,
  spend_amount: Trophy,
  streak: Award,
};

export function GamificationPanel({ challenges: initialChallenges, badges: initialBadges, summary }: GamificationPanelProps) {
  const t = useTranslations('gamification');
  const tCommon = useTranslations('common');

  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [activeTab, setActiveTab] = useState<'challenges' | 'badges'>('challenges');
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Challenge form state
  const [challengeName, setChallengeName] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeType, setChallengeType] = useState<Challenge['type']>('visit_count');
  const [goalValue, setGoalValue] = useState('');
  const [bonusPoints, setBonusPoints] = useState('');

  // Badge form state
  const [badgeName, setBadgeName] = useState('');
  const [badgeDescription, setBadgeDescription] = useState('');
  const [badgeRarity, setBadgeRarity] = useState<Badge['rarity']>('common');

  const resetChallengeForm = () => {
    setChallengeName('');
    setChallengeDescription('');
    setChallengeType('visit_count');
    setGoalValue('');
    setBonusPoints('');
    setShowChallengeForm(false);
    setError(null);
  };

  const resetBadgeForm = () => {
    setBadgeName('');
    setBadgeDescription('');
    setBadgeRarity('common');
    setShowBadgeForm(false);
    setError(null);
  };

  const handleCreateChallenge = async () => {
    if (!challengeName.trim() || !goalValue) return;
    setSubmitting(true);
    setError(null);

    const result = await createChallenge({
      name: challengeName.trim(),
      description: challengeDescription.trim() || undefined,
      type: challengeType,
      goal_value: parseInt(goalValue, 10),
      bonus_points: bonusPoints ? parseInt(bonusPoints, 10) : 0,
      status: 'draft',
    });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data) {
      setChallenges((prev) => [result.data as Challenge, ...prev]);
    }
    resetChallengeForm();
  };

  const handleCreateBadge = async () => {
    if (!badgeName.trim()) return;
    setSubmitting(true);
    setError(null);

    const result = await createBadge({
      name: badgeName.trim(),
      description: badgeDescription.trim() || undefined,
      rarity: badgeRarity,
    });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data) {
      setBadges((prev) => [result.data as Badge, ...prev]);
    }
    resetBadgeForm();
  };

  const handleActivate = async (challengeId: string) => {
    const result = await updateChallengeStatus(challengeId, 'active');
    if (!result.error) {
      setChallenges((prev) =>
        prev.map((c) => (c.id === challengeId ? { ...c, status: 'active' } : c))
      );
    }
  };

  const handleArchive = async (challengeId: string) => {
    const result = await updateChallengeStatus(challengeId, 'archived');
    if (!result.error) {
      setChallenges((prev) =>
        prev.map((c) => (c.id === challengeId ? { ...c, status: 'archived' } : c))
      );
    }
  };

  const handleDelete = async (challengeId: string) => {
    const result = await deleteChallenge(challengeId);
    if (!result.error) {
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">{t('activeChallenges')}</span>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{summary.activeChallenges}</span>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">{t('totalBadges')}</span>
            <Award className="h-5 w-5 text-gray-400" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{summary.totalBadges}</span>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">{t('completionsThisMonth')}</span>
            <Trophy className="h-5 w-5 text-gray-400" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{summary.completionsThisMonth}</span>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">{t('topChallenge')}</span>
            <Star className="h-5 w-5 text-gray-400" />
          </div>
          {summary.topChallenge ? (
            <div>
              <p className="font-semibold text-gray-900 text-sm truncate">{summary.topChallenge.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{summary.topChallenge.completions} {t('completions')}</p>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">{t('noData')}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'challenges'
              ? 'border-brand-purple text-brand-purple'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('challenges')}
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'badges'
              ? 'border-brand-purple text-brand-purple'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('badges')}
        </button>
      </div>

      {/* Challenges tab */}
      {activeTab === 'challenges' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowChallengeForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('createChallenge')}
            </button>
          </div>

          {showChallengeForm && (
            <div className="mb-6 bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('newChallenge')}</h3>
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('challengeName')}</label>
                  <input
                    type="text"
                    value={challengeName}
                    onChange={(e) => setChallengeName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                    placeholder={t('challengeNamePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('challengeType')}</label>
                  <select
                    value={challengeType}
                    onChange={(e) => setChallengeType(e.target.value as Challenge['type'])}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                  >
                    {Object.entries(CHALLENGE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('goalValue')}</label>
                  <input
                    type="number"
                    value={goalValue}
                    onChange={(e) => setGoalValue(e.target.value)}
                    min="1"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bonusPoints')}</label>
                  <input
                    type="number"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(e.target.value)}
                    min="0"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                    placeholder="500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                  <textarea
                    value={challengeDescription}
                    onChange={(e) => setChallengeDescription(e.target.value)}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
                    placeholder={t('descriptionPlaceholder')}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4 justify-end">
                <button onClick={resetChallengeForm} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleCreateChallenge}
                  disabled={submitting || !challengeName.trim() || !goalValue}
                  className="px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? tCommon('saving') : tCommon('save')}
                </button>
              </div>
            </div>
          )}

          {challenges.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t('noChallenges')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('noChallengesDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.map((challenge) => {
                const Icon = CHALLENGE_TYPE_ICONS[challenge.type] ?? Target;
                return (
                  <div key={challenge.id} className="bg-white rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-brand-purple-100 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-brand-purple" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{challenge.name}</p>
                        <p className="text-sm text-gray-500">
                          {CHALLENGE_TYPE_LABELS[challenge.type]} · Goal: {challenge.goal_value}
                          {challenge.bonus_points > 0 && ` · +${challenge.bonus_points} pts bonus`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        challenge.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : challenge.status === 'archived'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {challenge.status}
                      </span>
                      {challenge.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleActivate(challenge.id)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title={t('activate')}
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(challenge.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title={tCommon('delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {challenge.status === 'active' && (
                        <button
                          onClick={() => handleArchive(challenge.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title={t('archive')}
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Badges tab */}
      {activeTab === 'badges' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowBadgeForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('createBadge')}
            </button>
          </div>

          {showBadgeForm && (
            <div className="mb-6 bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('newBadge')}</h3>
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('badgeName')}</label>
                  <input
                    type="text"
                    value={badgeName}
                    onChange={(e) => setBadgeName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                    placeholder={t('badgeNamePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('rarity')}</label>
                  <select
                    value={badgeRarity}
                    onChange={(e) => setBadgeRarity(e.target.value as Badge['rarity'])}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                  >
                    <option value="common">{t('rarityCommon')}</option>
                    <option value="rare">{t('rarityRare')}</option>
                    <option value="epic">{t('rarityEpic')}</option>
                    <option value="legendary">{t('rarityLegendary')}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                  <textarea
                    value={badgeDescription}
                    onChange={(e) => setBadgeDescription(e.target.value)}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
                    placeholder={t('descriptionPlaceholder')}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4 justify-end">
                <button onClick={resetBadgeForm} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleCreateBadge}
                  disabled={submitting || !badgeName.trim()}
                  className="px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? tCommon('saving') : tCommon('save')}
                </button>
              </div>
            </div>
          )}

          {badges.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t('noBadges')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('noBadgesDesc')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <div key={badge.id} className="bg-white rounded-xl border p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-brand-purple-100 flex items-center justify-center shrink-0">
                      <Award className="h-6 w-6 text-brand-purple" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{badge.name}</p>
                      {badge.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{badge.description}</p>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${RARITY_COLORS[badge.rarity]}`}>
                        {badge.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
