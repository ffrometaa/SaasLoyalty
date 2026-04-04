'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FeatureGate } from './FeatureGate';
import type { Plan } from '@/lib/plans/features';

interface Challenge {
  id: string;
  name: string;
  type: string;
  goal_value: number;
  bonus_points: number;
  status: string;
}

interface MissionStep {
  id: string;
  challenge_id: string;
  step_order: number;
}

interface Mission {
  id: string;
  name: string;
  description: string | null;
  bonus_points: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  mission_steps: MissionStep[];
}

interface MissionBuilderProps {
  plan: Plan;
  missions: Mission[];
  challenges: Challenge[];
  onCreateMission?: (data: { name: string; description: string; bonusPoints: number; challengeIds: string[] }) => Promise<void>;
  onToggleMission?: (missionId: string, isActive: boolean) => Promise<void>;
}

const EMPTY_FORM = { name: '', description: '', bonusPoints: 100, challengeIds: [] as string[] };

export function MissionBuilder({ plan, missions, challenges, onCreateMission, onToggleMission }: MissionBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const activeChallenges = challenges.filter(c => c.status === 'active');

  function toggleChallenge(id = '') {
    setForm(prev => {
      const ids = prev.challengeIds.includes(id)
        ? prev.challengeIds.filter(c => c !== id)
        : [...prev.challengeIds, id];
      return { ...prev, challengeIds: ids };
    });
  }

  function handleSubmit() {
    if (!onCreateMission || !form.name || form.challengeIds.length < 2) return;
    startTransition(async () => {
      await onCreateMission({ name: form.name, description: form.description, bonusPoints: form.bonusPoints, challengeIds: form.challengeIds });
      setForm(EMPTY_FORM);
      setShowForm(false);
      router.refresh();
    });
  }

  function handleToggle(missionId = '', isActive = false) {
    if (!onToggleMission) return;
    startTransition(async () => {
      await onToggleMission(missionId, !isActive);
      router.refresh();
    });
  }

  return (
    <FeatureGate plan={plan} feature="gamification_advanced">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Mission Builder</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-step challenge sequences — {missions.filter(m => m.is_active).length} active
            </p>
          </div>
          <button
            onClick={() => setShowForm(o => !o)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors"
          >
            {showForm ? 'Cancel' : '+ Mission'}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="mb-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-lg space-y-3">
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Mission name…"
              className="w-full bg-white/[0.05] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
            />
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description (optional)…"
              rows={2}
              className="w-full bg-white/[0.05] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none resize-none"
            />
            <div>
              <p className="text-[10px] text-slate-500 mb-2">Select challenges (min 2, in order):</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {activeChallenges.map(c => {
                  const selected = form.challengeIds.includes(c.id);
                  const order = form.challengeIds.indexOf(c.id) + 1;
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleChallenge(c.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all ${
                        selected
                          ? 'bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-white'
                          : 'bg-white/[0.03] border border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {selected && <span className="text-[10px] font-bold text-[#a78bfa] w-4">{order}.</span>}
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-slate-500 text-[10px]">+{c.bonus_points}pts</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-500 shrink-0">Bonus points:</label>
              <input
                type="number"
                min={0}
                value={form.bonusPoints}
                onChange={e => setForm(p => ({ ...p, bonusPoints: parseInt(e.target.value) || 0 }))}
                className="w-24 bg-white/[0.05] border border-white/[0.08] text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isPending || !form.name || form.challengeIds.length < 2}
              className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 transition-colors"
            >
              {isPending ? 'Creating…' : 'Create Mission'}
            </button>
          </div>
        )}

        {/* Mission list */}
        {missions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No missions yet. Create one to link multiple challenges into a sequence.
          </p>
        ) : (
          <div className="space-y-2">
            {missions.map(mission => (
              <div
                key={mission.id}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border ${
                  mission.is_active
                    ? 'bg-white/[0.03] border-white/[0.08]'
                    : 'bg-white/[0.01] border-white/[0.04] opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{mission.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {mission.mission_steps.length} steps · +{mission.bonus_points} bonus pts
                  </p>
                </div>
                {onToggleMission && (
                  <button
                    onClick={() => handleToggle(mission.id, mission.is_active)}
                    disabled={isPending}
                    className={`text-[10px] font-semibold transition-colors ${
                      mission.is_active
                        ? 'text-green-400 hover:text-slate-400'
                        : 'text-slate-500 hover:text-green-400'
                    }`}
                  >
                    {mission.is_active ? 'Active' : 'Inactive'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
