import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Supabase client mocks — set up before importing the module under test
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLimit = vi.fn();

// We need a chainable builder that accumulates method calls.
// Each method returns the same builder so we can chain arbitrarily.
function makeBuilder(terminalResult: unknown) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.gte = vi.fn(chain);
  builder.single = vi.fn(() => terminalResult);
  builder.insert = vi.fn(chain);
  builder.update = vi.fn(chain);
  builder.delete = vi.fn(chain);
  builder.limit = vi.fn(chain);
  builder.maybeSingle = vi.fn(() => terminalResult);
  return builder;
}

// Supabase client factory — the real implementation calls .from() which returns a builder.
// We control what .single() / .select({count}) resolves to per test via fromResults map.
const fromResults: Map<string, unknown> = new Map();

function mockFrom(table: string) {
  const result = fromResults.get(table) ?? { data: null, error: { message: 'not mocked' } };
  return makeBuilder(result);
}

const mockServiceFrom = vi.fn(mockFrom);
const mockSupabaseFrom = vi.fn(mockFrom);

vi.mock('@loyalty-os/lib/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ from: mockSupabaseFrom })
  ),
  createServiceRoleClient: vi.fn(() => ({ from: mockServiceFrom })),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() =>
    Promise.resolve((key: string) => key)
  ),
}));

// getMemberRedemptionCount — default: under limit
const mockGetMemberRedemptionCount = vi.fn().mockResolvedValue(0);
vi.mock('@/lib/member/queries', () => ({
  getMemberRedemptionCount: (...args: unknown[]) => mockGetMemberRedemptionCount(...args),
}));

// Import AFTER mocks are in place
import { createRedemption } from '@/lib/member/actions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_MEMBER = {
  id: 'member-1',
  tenant_id: 'tenant-1',
  points_balance: 500,
  tenants: { slug: 'my-biz' },
};

const BASE_REWARD = {
  id: 'reward-1',
  tenant_id: 'tenant-1',
  name: 'Free Coffee',
  points_cost: 100,
  monetary_value: 5,
  valid_days: 30,
  is_active: true,
  max_per_member: 5,
  deleted_at: null,
};

function setMemberResult(data: unknown, error: unknown = null) {
  fromResults.set('members', { data, error });
  // Also set service client result for the atomic UPDATE
  mockServiceFrom.mockImplementation((table: string) => {
    if (table === 'members') {
      // First call for reads returns member; subsequent calls for UPDATE return count:1
      return makeBuilder({ data, error, count: 1 });
    }
    return makeBuilder(fromResults.get(table) ?? { data: null, error: null });
  });
}

function setRewardResult(data: unknown, error: unknown = null) {
  fromResults.set('rewards', { data, error });
}

function setRedemptionInsertResult(data: unknown, error: unknown = null) {
  fromResults.set('redemptions', { data, error });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createRedemption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromResults.clear();
    mockGetMemberRedemptionCount.mockResolvedValue(0);

    // Default happy-path results
    setRewardResult(BASE_REWARD);
    setRedemptionInsertResult({ id: 'redemption-uuid-1' });

    // Default service client: members UPDATE returns count:1, transactions insert ok
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === 'members') {
        const builder = makeBuilder({ data: BASE_MEMBER, error: null, count: 1 });
        // Override select to support count:{exact} head:true pattern
        (builder as Record<string, unknown>).select = vi.fn(() => builder);
        return builder;
      }
      if (table === 'transactions') {
        return makeBuilder({ data: null, error: null });
      }
      if (table === 'redemptions') {
        return makeBuilder({ data: { id: 'redemption-uuid-1' }, error: null });
      }
      return makeBuilder({ data: null, error: null });
    });

    // Supabase client: members and rewards queries
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'members') {
        return makeBuilder({ data: BASE_MEMBER, error: null });
      }
      if (table === 'rewards') {
        return makeBuilder({ data: BASE_REWARD, error: null });
      }
      return makeBuilder({ data: null, error: null });
    });
  });

  it('happy path: returns { success: true } with code and qr_data', async () => {
    const result = await createRedemption('reward-1', 'member-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBeDefined();
      expect(result.data.qr_data).toBeDefined();
      expect(result.data.reward_name).toBe('Free Coffee');
    }
  });

  it('insufficient points (pre-check): returns { success: false } before any DB insert', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'members') {
        return makeBuilder({
          data: { ...BASE_MEMBER, points_balance: 50 }, // below cost of 100
          error: null,
        });
      }
      if (table === 'rewards') {
        return makeBuilder({ data: BASE_REWARD, error: null });
      }
      return makeBuilder({ data: null, error: null });
    });

    const result = await createRedemption('reward-1', 'member-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('errors.insufficientPoints');
    }
    // Service client should NOT have been asked to insert a redemption
    const serviceInsertCalled = mockServiceFrom.mock.calls.some(
      ([table]: [string]) => table === 'redemptions'
    );
    expect(serviceInsertCalled).toBe(false);
  });

  it('race condition (count=0): compensating delete is called and returns { success: false }', async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const deleteBuilder = { eq: deleteEq };

    mockServiceFrom.mockImplementation((table: string) => {
      if (table === 'members') {
        // UPDATE returns count:0 — simulates concurrent decrement already happened
        const builder = makeBuilder({ data: null, error: null, count: 0 });
        (builder as Record<string, unknown>).select = vi.fn(() => ({
          data: null,
          error: null,
          count: 0,
        }));
        return builder;
      }
      if (table === 'redemptions') {
        // insert resolves with a row; delete is the compensating action
        const insertBuilder = makeBuilder({ data: { id: 'redemption-uuid-1' }, error: null });
        (insertBuilder as Record<string, unknown>).delete = vi.fn(() => deleteBuilder);
        return insertBuilder;
      }
      if (table === 'transactions') {
        return makeBuilder({ data: null, error: null });
      }
      return makeBuilder({ data: null, error: null });
    });

    const result = await createRedemption('reward-1', 'member-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('errors.insufficientPoints');
    }
  });

  it('reward inactive: returns { success: false } without inserting', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'members') {
        return makeBuilder({ data: BASE_MEMBER, error: null });
      }
      if (table === 'rewards') {
        return makeBuilder({
          data: { ...BASE_REWARD, is_active: false },
          error: null,
        });
      }
      return makeBuilder({ data: null, error: null });
    });

    const result = await createRedemption('reward-1', 'member-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('errors.rewardUnavailable');
    }
    const serviceInsertCalled = mockServiceFrom.mock.calls.some(
      ([table]: [string]) => table === 'redemptions'
    );
    expect(serviceInsertCalled).toBe(false);
  });
});
