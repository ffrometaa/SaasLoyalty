import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/analytics',
  useSearchParams: vi.fn(),
}));

import { useSearchParams } from 'next/navigation';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeSearchParams(params: Record<string, string>) {
  return {
    get: (key: string) => params[key] ?? null,
  };
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getExpectedThisMonth() {
  const today = new Date();
  const from = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
  const to = fmt(today);
  return { from, to };
}

function getExpectedLast30() {
  const today = new Date();
  const from = fmt(new Date(today.getTime() - 29 * 86400000));
  const to = fmt(today);
  return { from, to };
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no active params
  (useSearchParams as Mock).mockReturnValue(makeSearchParams({}));
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('DateRangePicker', () => {
  it('renders three preset buttons', () => {
    render(<DateRangePicker />);
    expect(screen.getByText('This month')).toBeDefined();
    expect(screen.getByText('Last 30 days')).toBeDefined();
    expect(screen.getByText('Last 90 days')).toBeDefined();
  });

  it('clicking "This month" calls router.push with correct from/to', () => {
    render(<DateRangePicker />);
    fireEvent.click(screen.getByText('This month'));

    const { from, to } = getExpectedThisMonth();
    expect(mockPush).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith(`/analytics?from=${from}&to=${to}`);
  });

  it('clicking "Last 30 days" calls router.push with from = today minus 29 days', () => {
    render(<DateRangePicker />);
    fireEvent.click(screen.getByText('Last 30 days'));

    const { from, to } = getExpectedLast30();
    expect(mockPush).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith(`/analytics?from=${from}&to=${to}`);
  });

  it('"This month" button has active class when URL params match', () => {
    const { from, to } = getExpectedThisMonth();
    (useSearchParams as Mock).mockReturnValue(makeSearchParams({ from, to }));

    render(<DateRangePicker />);
    const btn = screen.getByText('This month').closest('button');
    expect(btn?.className).toContain('border-brand-purple');
  });

  it('"Last 30 days" button is inactive when "This month" is active', () => {
    const { from, to } = getExpectedThisMonth();
    (useSearchParams as Mock).mockReturnValue(makeSearchParams({ from, to }));

    render(<DateRangePicker />);
    const btn = screen.getByText('Last 30 days').closest('button');
    // Should NOT have the active class
    expect(btn?.className).not.toContain('border-brand-purple');
    expect(btn?.className).toContain('border-gray-200');
  });
});
