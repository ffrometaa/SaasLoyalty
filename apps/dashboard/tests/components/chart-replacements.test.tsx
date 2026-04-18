import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock recharts with simple div wrappers
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="BarChart">{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="Bar">{children}</div>,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="ResponsiveContainer">{children}</div>,
  Cell: () => <div data-testid="Cell" />,
  Legend: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  CartesianGrid: () => <div />,
}));

import { MemberSegmentsBarChart } from '@/components/analytics/MemberSegmentsBarChart';
import { PointsTimelineBarChart } from '@/components/analytics/PointsTimelineBarChart';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeSegments(count = 5) {
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
  return Array.from({ length: count }, (_, i) => ({
    name: `Segment ${i + 1}`,
    count: (i + 1) * 10,
    color: colors[i % colors.length],
  }));
}

function makeTimelineData(count = 8) {
  return Array.from({ length: count }, (_, i) => ({
    label: `W${i + 1}`,
    earned: (i + 1) * 100,
    redeemed: (i + 1) * 50,
  }));
}

// ─── MemberSegmentsBarChart ───────────────────────────────────────────────────

describe('MemberSegmentsBarChart', () => {
  it('renders with 5 segments data without throwing', () => {
    const data = makeSegments(5);
    const { container } = render(<MemberSegmentsBarChart data={data} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByTestId('ResponsiveContainer')).toBeDefined();
    expect(screen.getByTestId('BarChart')).toBeDefined();
  });

  it('renders a Cell for each segment', () => {
    const data = makeSegments(5);
    render(<MemberSegmentsBarChart data={data} />);
    const cells = screen.getAllByTestId('Cell');
    expect(cells).toHaveLength(5);
  });

  it('renders with empty data without throwing', () => {
    const { container } = render(<MemberSegmentsBarChart data={[]} />);
    expect(container.firstChild).not.toBeNull();
  });
});

// ─── PointsTimelineBarChart ───────────────────────────────────────────────────

describe('PointsTimelineBarChart', () => {
  it('renders with 8 data points without throwing', () => {
    const data = makeTimelineData(8);
    const { container } = render(<PointsTimelineBarChart data={data} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByTestId('ResponsiveContainer')).toBeDefined();
    expect(screen.getByTestId('BarChart')).toBeDefined();
  });

  it('renders both Bar components (earned + redeemed)', () => {
    const data = makeTimelineData(8);
    render(<PointsTimelineBarChart data={data} />);
    const bars = screen.getAllByTestId('Bar');
    expect(bars.length).toBeGreaterThanOrEqual(2);
  });

  it('renders with empty data without throwing', () => {
    const { container } = render(<PointsTimelineBarChart data={[]} />);
    expect(container.firstChild).not.toBeNull();
  });
});
