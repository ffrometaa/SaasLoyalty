import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks must be declared before imports — Vitest hoists them
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock('@loyalty-os/lib/server', () => ({
  getAuthedUser: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

import { getAuthedUser, createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { GET } from '@/app/api/analytics/route';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeQueryChain(resolvedValue: unknown = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'gte', 'lte', 'not', 'is', 'order', 'limit', 'single'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnThis();
  }
  // Default resolved value — override per-test via mockResolvedValueOnce
  (chain.single as Mock).mockResolvedValue(resolvedValue);
  // Non-single terminal — return resolved value when awaited
  const proxy = new Proxy(chain, {
    get(target, prop) {
      if (prop === 'then') {
        // Make the chain itself thenable so `await chain.eq(...)` works
        return (resolve: (v: unknown) => void) => resolve(resolvedValue);
      }
      return target[prop as string];
    },
  });
  return proxy as Record<string, Mock>;
}

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/analytics');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('GET /api/analytics (extended fields)', () => {
  it('returns 401 when no user', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce(null);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns revenue_this_month as sum of visit amounts', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    // createServerSupabaseClient — tenant resolution
    const tenantChain = makeQueryChain({ data: { id: 'tenant-1' }, error: null });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn()
        .mockReturnValueOnce(tenantChain) // tenants (owner)
        .mockReturnValueOnce(makeQueryChain({ data: null, error: null })), // tenant_users fallback (not reached)
    });

    // createServiceRoleClient — data queries
    const visitAmountData = { data: [{ amount: 500 }, { amount: 300 }, { amount: 200 }], error: null };
    const lastVisitAmountData = { data: [], error: null };
    const membersData = { data: [{ visits_total: 3, status: 'active', points_balance: 100 }], error: null };
    const newMembersData = { data: [], error: null };

    const makeChainWith = (resolved: unknown) => {
      const c = makeQueryChain(resolved);
      for (const m of ['select', 'eq', 'gte', 'lte', 'not', 'is', 'order', 'limit']) {
        (c[m] as Mock).mockReturnThis();
      }
      return new Proxy(c, {
        get(target, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(resolved);
          return target[prop as string];
        },
      });
    };

    let callIndex = 0;
    const returnValues = [
      { count: 5, error: null },        // activeMembers
      { count: 10, error: null },       // visitsThisMonth
      { count: 8, error: null },        // visitsLastMonth
      { data: [], error: null },        // redemptionsThisMonth
      { data: [], error: null },        // redemptionsLastMonth
      { count: 6, error: null },        // totalMembersEver
      membersData,                      // allMembers (visits_total, status, points_balance)
      { data: [], error: null },        // visitData (heatmap)
      { data: [], error: null },        // rewardRedemptions
      visitAmountData,                  // visitsWithAmount (revenue this period)
      lastVisitAmountData,              // lastVisitsWithAmount (revenue last period)
      newMembersData,                   // newMembersRaw
    ];

    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        const resolved = returnValues[callIndex++] ?? { data: null, error: null };
        return makeChainWith(resolved);
      }),
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.revenue_this_month).toBe(1000); // 500 + 300 + 200
  });

  it('returns points_liability as sum of active member balances', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantChain = makeQueryChain({ data: { id: 'tenant-1' }, error: null });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValueOnce(tenantChain),
    });

    const membersData = {
      data: [
        { visits_total: 3, status: 'active', points_balance: 2000 },
        { visits_total: 6, status: 'active', points_balance: 3000 },
        { visits_total: 1, status: 'inactive', points_balance: 500 }, // should be excluded
      ],
      error: null,
    };

    const makeChainWith = (resolved: unknown) => {
      const c = makeQueryChain(resolved);
      return new Proxy(c, {
        get(target, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(resolved);
          return target[prop as string];
        },
      });
    };

    let callIndex = 0;
    const returnValues = [
      { count: 2, error: null },
      { count: 5, error: null },
      { count: 4, error: null },
      { data: [], error: null },
      { data: [], error: null },
      { count: 3, error: null },
      membersData,
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ];

    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        const resolved = returnValues[callIndex++] ?? { data: null, error: null };
        return makeChainWith(resolved);
      }),
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.points_liability).toBe(5000); // 2000 + 3000 (inactive excluded)
  });

  it('returns new_members_monthly with 12 items', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantChain = makeQueryChain({ data: { id: 'tenant-1' }, error: null });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValueOnce(tenantChain),
    });

    const makeChainWith = (resolved: unknown) => {
      const c = makeQueryChain(resolved);
      return new Proxy(c, {
        get(target, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(resolved);
          return target[prop as string];
        },
      });
    };

    let callIndex = 0;
    const returnValues = [
      { count: 10, error: null },
      { count: 5, error: null },
      { count: 4, error: null },
      { data: [], error: null },
      { data: [], error: null },
      { count: 12, error: null },
      { data: [{ visits_total: 5, status: 'active', points_balance: 0 }], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [{ created_at: new Date().toISOString() }], error: null }, // newMembersRaw
    ];

    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        const resolved = returnValues[callIndex++] ?? { data: null, error: null };
        return makeChainWith(resolved);
      }),
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.new_members_monthly)).toBe(true);
    expect(body.new_members_monthly).toHaveLength(12);
    expect(body.new_members_monthly[0]).toHaveProperty('month');
    expect(body.new_members_monthly[0]).toHaveProperty('count');
  });

  it('returns tier_distribution with 4 items (bronze/silver/gold/platinum)', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantChain = makeQueryChain({ data: { id: 'tenant-1' }, error: null });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValueOnce(tenantChain),
    });

    const membersData = {
      data: [
        { visits_total: 2, status: 'active', points_balance: 0 },   // bronze
        { visits_total: 8, status: 'active', points_balance: 0 },   // silver
        { visits_total: 20, status: 'active', points_balance: 0 },  // gold
        { visits_total: 35, status: 'active', points_balance: 0 },  // platinum
      ],
      error: null,
    };

    const makeChainWith = (resolved: unknown) => {
      const c = makeQueryChain(resolved);
      return new Proxy(c, {
        get(target, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(resolved);
          return target[prop as string];
        },
      });
    };

    let callIndex = 0;
    const returnValues = [
      { count: 4, error: null },
      { count: 4, error: null },
      { count: 3, error: null },
      { data: [], error: null },
      { data: [], error: null },
      { count: 4, error: null },
      membersData,
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ];

    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        const resolved = returnValues[callIndex++] ?? { data: null, error: null };
        return makeChainWith(resolved);
      }),
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.tier_distribution)).toBe(true);
    expect(body.tier_distribution).toHaveLength(4);
    const tiers = body.tier_distribution.map((t: { tier: string }) => t.tier);
    expect(tiers).toContain('bronze');
    expect(tiers).toContain('silver');
    expect(tiers).toContain('gold');
    expect(tiers).toContain('platinum');
  });

  it('GET with from/to params passes them through to the visit query', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantChain = makeQueryChain({ data: { id: 'tenant-1' }, error: null });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValueOnce(tenantChain),
    });

    const customFrom = '2026-01-01T00:00:00.000Z';
    const customTo = '2026-01-31T23:59:59.000Z';

    // Track gte calls to verify from was passed
    const gteCalls: string[] = [];
    const makeChainWith = (resolved: unknown) => {
      const c: Record<string, unknown> = {};
      const methods = ['select', 'eq', 'lte', 'not', 'is', 'order', 'limit', 'single'];
      for (const m of methods) c[m] = vi.fn().mockReturnThis();
      c['gte'] = vi.fn().mockImplementation((_col: string, val: string) => {
        gteCalls.push(val);
        return c;
      });
      return new Proxy(c, {
        get(target, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(resolved);
          return target[prop as string];
        },
      });
    };

    let callIndex = 0;
    const returnValues = [
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
      { data: [], error: null },
      { data: [], error: null },
      { count: 0, error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ];

    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        const resolved = returnValues[callIndex++] ?? { data: null, error: null };
        return makeChainWith(resolved);
      }),
    });

    await GET(makeRequest({ from: customFrom, to: customTo }));

    // The revenue query uses `from` as a gte argument
    expect(gteCalls).toContain(customFrom);
  });

  it('GET with no params defaults from to first of month', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantChain = makeQueryChain({ data: { id: 'tenant-1' }, error: null });
    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValueOnce(tenantChain),
    });

    const gteCalls: string[] = [];
    const makeChainWith = (resolved: unknown) => {
      const c: Record<string, unknown> = {};
      const methods = ['select', 'eq', 'lte', 'not', 'is', 'order', 'limit', 'single'];
      for (const m of methods) c[m] = vi.fn().mockReturnThis();
      c['gte'] = vi.fn().mockImplementation((_col: string, val: string) => {
        gteCalls.push(val);
        return c;
      });
      return new Proxy(c, {
        get(target, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(resolved);
          return target[prop as string];
        },
      });
    };

    let callIndex = 0;
    const returnValues = Array(12).fill({ data: [], error: null }).map((v, i) =>
      i < 6 ? { count: 0, error: null } : v
    );

    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        const resolved = returnValues[callIndex++] ?? { data: null, error: null };
        return makeChainWith(resolved);
      }),
    });

    await GET(makeRequest()); // no params

    const now = new Date();
    const expectedFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    // The default from (first of month) should appear in gte calls
    const firstOfMonthPrefix = expectedFrom.slice(0, 7); // e.g. "2026-04"
    expect(gteCalls.some(v => v.startsWith(firstOfMonthPrefix))).toBe(true);
  });
});
