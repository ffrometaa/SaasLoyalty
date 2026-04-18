'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLOR_MAP: Record<string, string> = {
  'bg-green-500': '#22c55e',
  'bg-blue-500': '#3b82f6',
  'bg-yellow-500': '#eab308',
  'bg-orange-500': '#f97316',
  'bg-red-500': '#ef4444',
};

interface Segment { name: string; count: number; color: string }
interface Props { data: Segment[] }

export function MemberSegmentsBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart layout="vertical" data={data} margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={90} />
        <Tooltip
          contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '0.75rem', color: '#f9fafb', fontSize: '12px' }}
          formatter={(v: number) => [v, 'Members']}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {data.map((seg) => <Cell key={seg.name} fill={COLOR_MAP[seg.color] ?? '#7c3aed'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
