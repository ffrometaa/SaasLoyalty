import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render } from '@testing-library/react';

// Mocks must be declared before imports — Vitest hoists them
vi.mock('@loyalty-os/lib/server', () => ({
  createServerSupabaseClient: vi.fn(),
  getAuthedUser: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';
import { PlanTrialBanner } from '@/components/PlanTrialBanner';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function makeQueryChain(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return chain;
}

/** Returns a trial_ends_at ISO string N days from now */
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('PlanTrialBanner', () => {
  it('returns null when getAuthedUser returns null', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce(null);

    const result = await PlanTrialBanner();
    expect(result).toBeNull();
  });

  it('returns null when plan_status is "active"', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({
      data: { plan_status: 'active', trial_ends_at: daysFromNow(10), is_founding_partner: false },
      error: null,
    });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: () => chain });

    const result = await PlanTrialBanner();
    expect(result).toBeNull();
  });

  it('returns null when plan_status is "trialing" but trial_ends_at is null', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({
      data: { plan_status: 'trialing', trial_ends_at: null, is_founding_partner: false },
      error: null,
    });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: () => chain });

    const result = await PlanTrialBanner();
    expect(result).toBeNull();
  });

  it('renders amber/blue variant when daysRemaining > 3', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({
      data: { plan_status: 'trialing', trial_ends_at: daysFromNow(10), is_founding_partner: false },
      error: null,
    });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: () => chain });

    const jsx = await PlanTrialBanner();
    const { container } = render(jsx!);

    const banner = container.firstChild as HTMLElement;
    expect(banner.style.background).toContain('1e40af');
  });

  it('renders red/urgent variant when daysRemaining <= 3', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({
      data: { plan_status: 'trialing', trial_ends_at: daysFromNow(2), is_founding_partner: false },
      error: null,
    });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: () => chain });

    const jsx = await PlanTrialBanner();
    const { container } = render(jsx!);

    const banner = container.firstChild as HTMLElement;
    expect(banner.style.background).toContain('b91c1c');
  });

  it('shows correct day count in rendered text', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({
      data: { plan_status: 'trialing', trial_ends_at: daysFromNow(10), is_founding_partner: false },
      error: null,
    });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: () => chain });

    const jsx = await PlanTrialBanner();
    const { container } = render(jsx!);

    expect(container.textContent).toContain('10');
    expect(container.textContent).toContain('days left');
  });

  it('shows founding partner text when is_founding_partner is true', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({
      data: { plan_status: 'trialing', trial_ends_at: daysFromNow(10), is_founding_partner: true },
      error: null,
    });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: () => chain });

    const jsx = await PlanTrialBanner();
    const { container } = render(jsx!);

    expect(container.textContent).toContain('Founding Partner');
  });

  it('does NOT show founding partner text when is_founding_partner is false', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({
      data: { plan_status: 'trialing', trial_ends_at: daysFromNow(10), is_founding_partner: false },
      error: null,
    });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: () => chain });

    const jsx = await PlanTrialBanner();
    const { container } = render(jsx!);

    expect(container.textContent).not.toContain('Founding Partner');
  });

  it('"Upgrade now" link points to /settings?tab=billing', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({
      data: { plan_status: 'trialing', trial_ends_at: daysFromNow(10), is_founding_partner: false },
      error: null,
    });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: () => chain });

    const jsx = await PlanTrialBanner();
    const { container } = render(jsx!);

    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/settings?tab=billing');
  });

  it('returns null when Supabase throws', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });
    (createServerSupabaseClient as Mock).mockRejectedValueOnce(new Error('DB error'));

    const result = await PlanTrialBanner();
    expect(result).toBeNull();
  });
});
