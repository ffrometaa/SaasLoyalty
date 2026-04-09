'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertChallengeTemplate, deleteChallengeTemplate } from '../../lib/engine/challenge-template-actions';
import type { MotivationType } from '../../lib/engine/behaviorScoring';
import type { ChallengeType, ChallengeTemplateRow } from '../../lib/engine/challenge-template-queries';

// ─── Default templates (mirrors challengeGenerator.ts defaults) ───────────────

const MOTIVATION_LABELS: Record<MotivationType, string> = {
  achiever:   'Achiever',
  competitor: 'Competitor',
  explorer:   'Explorer',
  socializer: 'Socializer',
};

const MOTIVATION_DESCRIPTIONS: Record<MotivationType, string> = {
  achiever:   'Members driven by points and completion.',
  competitor: 'Members driven by streaks and rankings.',
  explorer:   'Members driven by variety and discovery.',
  socializer: 'Members driven by referrals and community.',
};

const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  visit_count:   'Visit count',
  points_earned: 'Points earned',
  referral:      'Referrals',
  spend_amount:  'Spend amount',
  streak:        'Streak',
};

const DEFAULT_TEMPLATES: Record<MotivationType, { challengeType: ChallengeType; name: string; description: string; bonusPoints: number; ttlDays: number; goalMultiplier: number }> = {
  achiever:   { challengeType: 'points_earned', name: 'Points Powerhouse', description: 'Earn more points than ever this week.', bonusPoints: 150, ttlDays: 7, goalMultiplier: 1.2 },
  competitor: { challengeType: 'visit_count',   name: 'Visit Streak',      description: 'Beat your personal record and climb the leaderboard.', bonusPoints: 120, ttlDays: 7, goalMultiplier: 1.3 },
  explorer:   { challengeType: 'spend_amount',  name: 'Explorer Bonus',    description: 'Try something new — spend more and earn extra points.', bonusPoints: 80, ttlDays: 14, goalMultiplier: 1.1 },
  socializer: { challengeType: 'referral',      name: 'Community Builder', description: 'Refer two friends and unlock a special reward.', bonusPoints: 300, ttlDays: 14, goalMultiplier: 1.0 },
};

// ─── Single template card ─────────────────────────────────────────────────────

function TemplateCard({
  motivationType,
  existing,
  onSaved,
}: {
  motivationType: MotivationType;
  existing?: ChallengeTemplateRow;
  onSaved: () => void;
}) {
  const defaults = DEFAULT_TEMPLATES[motivationType];
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [challengeType, setChallengeType] = useState<ChallengeType>(existing?.challenge_type ?? defaults.challengeType);
  const [name, setName] = useState(existing?.name ?? defaults.name);
  const [description, setDescription] = useState(existing?.description ?? defaults.description);
  const [bonusPoints, setBonusPoints] = useState(existing?.bonus_points ?? defaults.bonusPoints);
  const [ttlDays, setTtlDays] = useState(existing?.ttl_days ?? defaults.ttlDays);
  const [goalMultiplier, setGoalMultiplier] = useState(existing?.goal_multiplier ?? defaults.goalMultiplier);
  const [error, setError] = useState<string | null>(null);

  const isCustomized = !!existing;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await upsertChallengeTemplate({
        motivationType,
        challengeType,
        name,
        description,
        bonusPoints,
        ttlDays,
        goalMultiplier,
      });
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        onSaved();
      }
    });
  }

  function handleReset() {
    if (!existing) return;
    if (!confirm('Reset to default template? This will delete your customization.')) return;
    startTransition(async () => {
      await deleteChallengeTemplate(existing.id);
      onSaved();
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{MOTIVATION_LABELS[motivationType]}</h3>
            {isCustomized && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-purple-50 text-brand-purple text-xs font-medium">Custom</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{MOTIVATION_DESCRIPTIONS[motivationType]}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCustomized && !editing && (
            <button onClick={handleReset} disabled={isPending} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Reset
            </button>
          )}
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs text-brand-purple hover:text-brand-purple-dark font-medium transition-colors"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Preview (read-only) */}
      {!editing && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-24">Challenge</span>
            <span className="text-gray-700">{name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-24">Type</span>
            <span className="text-gray-700">{CHALLENGE_TYPE_LABELS[challengeType]}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-24">Bonus</span>
            <span className="text-gray-700">{bonusPoints} pts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-24">Duration</span>
            <span className="text-gray-700">{ttlDays} days</span>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Challenge type</label>
            <select
              value={challengeType}
              onChange={(e) => setChallengeType(e.target.value as ChallengeType)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              {(Object.keys(CHALLENGE_TYPE_LABELS) as ChallengeType[]).map((t) => (
                <option key={t} value={t}>{CHALLENGE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bonus points</label>
              <input type="number" min={10} max={5000} value={bonusPoints} onChange={(e) => setBonusPoints(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (days)</label>
              <input type="number" min={1} max={90} value={ttlDays} onChange={(e) => setTtlDays(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Goal multiplier</label>
              <input type="number" min={0.5} max={5} step={0.1} value={goalMultiplier} onChange={(e) => setGoalMultiplier(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple" />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-xl hover:bg-brand-purple-dark disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save template'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

interface ChallengeTemplateEditorProps {
  templates: ChallengeTemplateRow[];
}

export default function ChallengeTemplateEditor({ templates }: ChallengeTemplateEditorProps) {
  const router = useRouter();
  const MOTIVATION_TYPES: MotivationType[] = ['achiever', 'competitor', 'explorer', 'socializer'];

  function findTemplate(motivationType: MotivationType): ChallengeTemplateRow | undefined {
    return templates.find((t) => t.motivation_type === motivationType);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Challenge Templates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize the challenges the engine generates for each member motivation type.
          Defaults are used when no custom template is defined.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOTIVATION_TYPES.map((motivationType) => (
          <TemplateCard
            key={motivationType}
            motivationType={motivationType}
            existing={findTemplate(motivationType)}
            onSaved={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  );
}
