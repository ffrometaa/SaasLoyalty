import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === 'atRiskCount' && params) return `${params.count} at-risk members`;
    return key;
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/analytics',
  useSearchParams: () => ({ get: () => null }),
}));

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  Legend: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
}));

// Mock SectionErrorBoundary — just render children
vi.mock('@/components/SectionErrorBoundary', () => ({
  SectionErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock TrialBanner
vi.mock('@/components/dashboard/TrialBanner', () => ({
  TrialBanner: () => <div data-testid="TrialBanner" />,
}));

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function mockFetch(planName: 'starter' | 'pro' | 'scale' | 'enterprise') {
  const analyticsPayload = {
    metrics: {
      activeMembers: 10,
      visitsThisMonth: 5,
      pointsRedeemedThisMonth: 100,
      retentionRate: 80,
      changes: { activeMembers: 0, visitsThisMonth: 5, pointsRedeemedThisMonth: 0, retentionRate: 0, revenue: 0 },
    },
    segments: { frequent: 2, regular: 3, occasional: 1, atRisk: 0, inactive: 0 },
    heatmap: [],
    topRewards: [],
    revenue_this_month: 1000,
    revenue_last_month: 900,
    revenue_change: 11,
    points_liability: 500,
    new_members_monthly: Array.from({ length: 12 }, (_, i) => ({ month: `M${i}`, count: i })),
    tier_distribution: [
      { tier: 'bronze', count: 5 },
      { tier: 'silver', count: 3 },
      { tier: 'gold', count: 1 },
      { tier: 'platinum', count: 1 },
    ],
  };

  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/analytics') && !url.includes('cohort') && !url.includes('funnel') && !url.includes('campaigns')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(analyticsPayload) });
    }
    if (url.includes('/api/settings')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ plan: planName }) });
    }
    if (url.includes('/api/feature-trials')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ trials: [] }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('Analytics plan gates', () => {
  it('with plan=starter, Cohorts tab content is gated (upgrade prompt visible)', async () => {
    mockFetch('starter');

    const { default: AnalyticsPage } = await import('@/app/(dashboard)/analytics/page');
    const { getByText } = render(<AnalyticsPage />);

    // Switch to cohorts tab
    await act(async () => {
      getByText('tabCohorts').click();
    });

    // FeatureGate renders an upgrade prompt when plan doesn't have analytics_full
    expect(screen.getByText('upgradeToUnlock')).toBeDefined();
  });

  it('with plan=pro, Cohorts tab content is NOT gated', async () => {
    mockFetch('pro');

    vi.resetModules();
    const { default: AnalyticsPage } = await import('@/app/(dashboard)/analytics/page');
    const { getByText } = render(<AnalyticsPage />);

    await act(async () => {
      getByText('tabCohorts').click();
    });

    // No upgrade prompt for pro plan (has analytics_full)
    expect(screen.queryByText('upgradeToUnlock')).toBeNull();
  });

  it('with plan=starter, Funnel tab content is gated', async () => {
    mockFetch('starter');

    vi.resetModules();
    const { default: AnalyticsPage } = await import('@/app/(dashboard)/analytics/page');
    const { getByText } = render(<AnalyticsPage />);

    await act(async () => {
      getByText('tabFunnel').click();
    });

    expect(screen.getByText('upgradeToUnlock')).toBeDefined();
  });

  it('with plan=starter, Campaigns tab content is gated', async () => {
    mockFetch('starter');

    vi.resetModules();
    const { default: AnalyticsPage } = await import('@/app/(dashboard)/analytics/page');
    const { getByText } = render(<AnalyticsPage />);

    await act(async () => {
      getByText('tabCampaigns').click();
    });

    expect(screen.getByText('upgradeToUnlock')).toBeDefined();
  });
});
