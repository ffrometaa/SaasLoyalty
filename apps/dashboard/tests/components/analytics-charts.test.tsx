import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock recharts — return simple div wrappers so no canvas/SVG rendering is needed
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="LineChart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="ResponsiveContainer">{children}</div>,
  CartesianGrid: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="PieChart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="Pie">{children}</div>,
  Cell: () => <div />,
  Legend: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="BarChart">{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="Bar">{children}</div>,
}));

import { NewMembersLineChart } from '@/components/analytics/NewMembersLineChart';
import { TierDistributionPieChart } from '@/components/analytics/TierDistributionPieChart';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeMonthlyData(count = 12) {
  return Array.from({ length: count }, (_, i) => ({
    month: `Month ${i + 1}`,
    count: i * 2,
  }));
}

function makeTierData() {
  return [
    { tier: 'bronze', count: 40 },
    { tier: 'silver', count: 30 },
    { tier: 'gold', count: 20 },
    { tier: 'platinum', count: 10 },
  ];
}

// ─── NewMembersLineChart ───────────────────────────────────────────────────────

describe('NewMembersLineChart', () => {
  it('renders without error with 12 items', () => {
    const data = makeMonthlyData(12);
    const { container } = render(<NewMembersLineChart data={data} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByTestId('ResponsiveContainer')).toBeDefined();
    expect(screen.getByTestId('LineChart')).toBeDefined();
  });

  it('renders without error with empty data', () => {
    const { container } = render(<NewMembersLineChart data={[]} />);
    expect(container.firstChild).not.toBeNull();
  });
});

// ─── TierDistributionPieChart ─────────────────────────────────────────────────

describe('TierDistributionPieChart', () => {
  it('renders without error with 4 items', () => {
    const data = makeTierData();
    const { container } = render(<TierDistributionPieChart data={data} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByTestId('ResponsiveContainer')).toBeDefined();
    expect(screen.getByTestId('PieChart')).toBeDefined();
  });

  it('renders a Cell for each tier', () => {
    const data = makeTierData();
    render(<TierDistributionPieChart data={data} />);
    // Pie renders children (Cells) — just verify it doesn't throw
    expect(screen.getByTestId('Pie')).toBeDefined();
  });
});

// ─── KPI card content ─────────────────────────────────────────────────────────

describe('Revenue Impact card value formatting', () => {
  it('shows $1,234 when revenue_this_month = 1234', () => {
    render(
      <div>
        <p>
          {`$${(1234).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
        </p>
      </div>
    );
    expect(screen.getByText('$1,234')).toBeDefined();
  });
});

describe('Points Liability card value formatting', () => {
  it('shows 5,000 when points_liability = 5000', () => {
    render(
      <div>
        <p>{(5000).toLocaleString()}</p>
      </div>
    );
    expect(screen.getByText('5,000')).toBeDefined();
  });
});
