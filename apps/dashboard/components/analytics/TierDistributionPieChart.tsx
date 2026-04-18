'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TIER_COLORS: Record<string, string> = {
  bronze: '#f59e0b',
  silver: '#94a3b8',
  gold: '#eab308',
  platinum: '#7c3aed',
};

interface Props { data: { tier: string; count: number }[] }

export function TierDistributionPieChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={80}>
          {data.map((entry) => (
            <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? '#6b7280'} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '0.75rem', color: '#f9fafb', fontSize: '12px' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
