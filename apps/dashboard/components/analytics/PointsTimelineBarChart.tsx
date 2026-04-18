'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint { label: string; earned: number; redeemed: number }
interface Props { data: DataPoint[] }

export function PointsTimelineBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '0.75rem', color: '#f9fafb', fontSize: '12px' }} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="earned" name="Points earned" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        <Bar dataKey="redeemed" name="Points redeemed" fill="#4ade80" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
