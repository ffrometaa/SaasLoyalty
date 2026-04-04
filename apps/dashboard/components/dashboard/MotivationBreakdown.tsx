'use client';

import { FeatureGate } from './FeatureGate';
import type { Plan } from '@/lib/plans/features';

type MotivationType = 'achiever' | 'socializer' | 'explorer' | 'competitor';

interface MotivationBreakdownProps {
  plan: Plan;
  scores: Array<{ motivation_type: string }>;
}

const MOTIVATION_META = Object.fromEntries(Object.entries({
  achiever:   { icon: '⭐', label: 'Achiever',   desc: 'Points & challenge-driven',  color: 'bg-[#7c3aed]/20 text-[#a78bfa] border-[#7c3aed]/30' },
  competitor: { icon: '🏆', label: 'Competitor', desc: 'Leaderboard & streak-driven', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  explorer:   { icon: '🔭', label: 'Explorer',   desc: 'Variety & discovery-driven',  color: 'bg-green-500/15 text-green-400 border-green-500/25' },
  socializer: { icon: '⚡', label: 'Socializer', desc: 'Referral & community-driven', color: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
}));

export function MotivationBreakdown({ plan, scores }: MotivationBreakdownProps) {
  const total = scores.length;

  const counts = { achiever: 0, competitor: 0, explorer: 0, socializer: 0 } as Record<MotivationType, number>;
  for (const s of scores) {
    const t = s.motivation_type as MotivationType;
    if (t in counts) counts[t]++;
  }

  const sorted = (Object.keys(counts) as MotivationType[]).sort((a, b) => counts[b] - counts[a]);

  return (
    <FeatureGate plan={plan} feature="gamification_advanced">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Motivation Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            How your {total} scored members are classified
          </p>
        </div>

        {total === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            Run the scoring engine to classify member motivations.
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map(type => {
              const meta = MOTIVATION_META[type];
              const count = counts[type];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-500">{meta.desc}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      {count} <span className="text-slate-500 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'var(--color-bar, #7c3aed)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
