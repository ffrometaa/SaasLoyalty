'use client';

import { FeatureGate } from './FeatureGate';
import type { Plan } from '@/lib/plans/features';

interface LeaderboardEntry {
  rank: number;
  memberId: string;
  name: string;
  tier: string;
  points: number;
  delta: number;
}

interface LeaderboardPreviewProps {
  plan: Plan;
  entries: LeaderboardEntry[];
  periodKey?: string;
  periodType?: 'month' | 'week';
  generatedAt?: string;
}

const TIER_DOTS = Object.fromEntries(Object.entries({
  bronze:   'bg-amber-700',
  silver:   'bg-slate-400',
  gold:     'bg-yellow-400',
  platinum: 'bg-cyan-300',
}));

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function DeltaBadge({ delta = 0 }) {
  if (delta === 0) return <span className="text-[10px] text-slate-600">—</span>;
  const up = delta > 0;
  return (
    <span className={`text-[10px] font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'}{Math.abs(delta)}
    </span>
  );
}

export function LeaderboardPreview({
  plan,
  entries,
  periodKey = '',
  periodType = 'month',
  generatedAt = '',
}: LeaderboardPreviewProps) {
  return (
    <FeatureGate plan={plan} feature="gamification_advanced">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Leaderboard</h3>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">
              {periodType === 'month' ? 'Monthly' : 'Weekly'} · {periodKey || 'Current period'}
            </p>
          </div>
          {generatedAt && (
            <span className="text-[10px] text-slate-600">
              Updated {new Date(generatedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No leaderboard data yet. The engine generates snapshots weekly and monthly.
          </p>
        ) : (
          <div className="space-y-1.5">
            {entries.slice(0, 10).map(entry => {
              const medal = RANK_MEDAL[entry.rank];
              const tierDot = TIER_DOTS[entry.tier] ?? 'bg-slate-600';
              return (
                <div
                  key={entry.memberId}
                  className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${
                    entry.rank <= 3
                      ? 'bg-white/[0.05] border border-white/[0.08]'
                      : 'bg-white/[0.02]'
                  }`}
                >
                  <div className="w-6 text-center shrink-0">
                    {medal ? (
                      <span className="text-sm">{medal}</span>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">#{entry.rank}</span>
                    )}
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${tierDot}`} />
                  <span className="flex-1 text-sm text-slate-200 truncate">{entry.name}</span>
                  <DeltaBadge delta={entry.delta} />
                  <span className="text-xs font-semibold text-slate-300 tabular-nums">
                    {entry.points.toLocaleString()} pts
                  </span>
                </div>
              );
            })}
            {entries.length > 10 && (
              <p className="text-[10px] text-slate-600 text-center pt-1">
                +{entries.length - 10} more members
              </p>
            )}
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
