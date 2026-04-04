'use client';

import { FeatureGate } from './FeatureGate';
import type { Plan } from '@/lib/plans/features';

interface ChurnMember {
  member_id: string;
  churn_score: number;
  engagement_score: number;
  days_since_visit: number;
  motivation_type: string;
  members: { name: string; email: string; tier: string } | null;
}

interface ChurnRiskMonitorProps {
  plan: Plan;
  members: ChurnMember[];
}

function riskLabel(score = 0) {
  if (score >= 0.85) return { label: 'Critical', cls: 'bg-red-500/15 text-red-400' };
  if (score >= 0.70) return { label: 'High', cls: 'bg-orange-500/15 text-orange-400' };
  return { label: 'Medium', cls: 'bg-yellow-500/15 text-yellow-400' };
}

function ChurnRiskContent({ members = [] as ChurnMember[] }) {
  if (members.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-sm font-medium text-slate-300">No high-risk members</p>
        <p className="text-xs text-slate-500 mt-1">All members are engaged — great work!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {members.map(m => {
        const risk = riskLabel(m.churn_score);
        const name = m.members?.name ?? 'Unknown';
        const email = m.members?.email ?? '';
        const tier = m.members?.tier ?? 'bronze';
        const pct = Math.round(m.churn_score * 100);
        const engPct = Math.round(m.engagement_score * 100);

        return (
          <div
            key={m.member_id}
            className="flex items-center gap-3 py-3 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-slate-200 truncate">{name}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${risk.cls}`}>
                  {risk.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">{email}</p>
              <p className="text-xs text-slate-600 mt-0.5 capitalize">
                {tier} · {m.days_since_visit}d since last visit · {m.motivation_type}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-red-400">{pct}%</p>
              <p className="text-[10px] text-slate-500">churn risk</p>
              <p className="text-xs text-slate-400 mt-0.5">{engPct}% engaged</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChurnRiskMonitor({ plan, members }: ChurnRiskMonitorProps) {
  return (
    <FeatureGate plan={plan} feature="gamification_advanced">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Churn Risk Monitor</h3>
            <p className="text-xs text-slate-500 mt-0.5">{members.length} members at risk</p>
          </div>
          <span className="text-xs text-slate-500 px-2 py-1 rounded bg-white/[0.04]">
            Score ≥ 60%
          </span>
        </div>
        <ChurnRiskContent members={members} />
      </div>
    </FeatureGate>
  );
}
