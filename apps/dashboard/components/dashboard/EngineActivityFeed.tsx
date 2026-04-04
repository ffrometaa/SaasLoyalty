'use client';

import { FeatureGate } from './FeatureGate';
import type { Plan } from '@/lib/plans/features';

interface ActivityEntry {
  id: string;
  event_type: string;
  members_affected: number;
  duration_ms: number | null;
  payload: Record<string, unknown>;
  created_at: string;
}

interface EngineActivityFeedProps {
  plan: Plan;
  events: ActivityEntry[];
}

const EVENT_META = Object.fromEntries(Object.entries({
  scoring_run:              { icon: '⚙️', label: 'Scoring Run',           color: 'text-[#a78bfa]' },
  intervention_triggered:   { icon: '🚨', label: 'Intervention',          color: 'text-orange-400' },
  multiplier_applied:       { icon: '⚡', label: 'Multiplier Applied',    color: 'text-yellow-400' },
  mission_completed:        { icon: '🏆', label: 'Mission Completed',     color: 'text-green-400' },
  leaderboard_generated:    { icon: '📊', label: 'Leaderboard Updated',   color: 'text-blue-400' },
  dynamic_challenge_created:{ icon: '🎯', label: 'Dynamic Challenge',     color: 'text-pink-400' },
}));

function formatDuration(ms: number | null) {
  if (!ms) return null;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(iso = '') {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function EngineActivityFeed({ plan, events }: EngineActivityFeedProps) {
  return (
    <FeatureGate plan={plan} feature="gamification_advanced">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Engine Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time scoring &amp; intervention log</p>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No engine activity yet. The scoring engine runs every 6 hours.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {events.map(e => {
              const meta = EVENT_META[e.event_type] ?? { icon: '●', label: e.event_type, color: 'text-slate-400' };
              const dur = formatDuration(e.duration_ms);
              return (
                <div
                  key={e.id}
                  className="flex items-start gap-3 py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className="text-base leading-none mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      {e.members_affected > 0 && (
                        <span className="text-[10px] text-slate-500">
                          {e.members_affected} member{e.members_affected !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {dur && <p className="text-[10px] text-slate-600 mt-0.5">{dur}</p>}
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(e.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
