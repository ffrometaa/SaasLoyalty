import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Supabase client mocks — set up before importing the module under test
// ---------------------------------------------------------------------------

function makeBuilder(terminalResult: unknown) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.is = vi.fn(chain);
  builder.in = vi.fn(chain);
  builder.single = vi.fn(() => terminalResult);
  builder.maybeSingle = vi.fn(() => terminalResult);
  builder.insert = vi.fn(() => terminalResult);
  builder.update = vi.fn(chain);
  return builder;
}

// Per-table result registry for service client
const serviceResults: Map<string, unknown> = new Map();
const mockServiceFrom = vi.fn((table: string) => {
  const result = serviceResults.get(table) ?? { data: null, error: null };
  return makeBuilder(result);
});

vi.mock('@loyalty-os/lib/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: {
              user: {
                id: 'user-uuid-1',
                email: 'test@example.com',
                user_metadata: {},
              },
            },
            error: null,
          })
        ),
      },
    })
  ),
  createServiceRoleClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn((token?: string) => {
        if (!token) return Promise.resolve({ data: { user: null }, error: new Error('no token') });
        return Promise.resolve({
          data: {
            user: {
              id: 'user-uuid-1',
              email: 'test@example.com',
              user_metadata: {},
            },
          },
          error: null,
        });
      }),
    },
    from: mockServiceFrom,
  })),
}));

// Import AFTER mocks
import { POST } from '@/app/api/auth/create-member/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/auth/create-member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-access-token',
    },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/create-member', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceResults.clear();

    // Default: member not linked, no email match, no referrer, tenant with no welcome bonus
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === 'members') {
        return makeBuilder({ data: null, error: { code: 'PGRST116', message: 'not found' } });
      }
      if (table === 'tenants') {
        return makeBuilder({
          data: { welcome_bonus_enabled: false, welcome_bonus_points: 0 },
          error: null,
        });
      }
      return makeBuilder({ data: null, error: null });
    });
  });

  it('with referralCode in body: referred_by is set in the insert call', async () => {
    const insertSpy = vi.fn(() => ({ data: null, error: null }));

    mockServiceFrom.mockImplementation((table: string) => {
      if (table === 'members') {
        const builder = makeBuilder({ data: null, error: { code: 'PGRST116', message: 'not found' } });
        // Override insert to capture the call
        (builder as Record<string, unknown>).insert = insertSpy;
        return builder;
      }
      if (table === 'tenants') {
        return makeBuilder({
          data: { welcome_bonus_enabled: false, welcome_bonus_points: 0 },
          error: null,
        });
      }
      return makeBuilder({ data: null, error: null });
    });

    // Referrer lookup: first members.single() call returns null (not linked),
    // second (email match) returns null, third (referral code lookup) returns a referrer
    let membersCallCount = 0;
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === 'members') {
        membersCallCount++;
        const callIndex = membersCallCount;
        if (callIndex === 3) {
          // referral code lookup — return a referrer
          return makeBuilder({ data: { id: 'referrer-uuid' }, error: null });
        }
        if (callIndex <= 2) {
          // linked check + email match — not found
          const builder = makeBuilder({ data: null, error: { code: 'PGRST116', message: 'not found' } });
          if (callIndex === 2) {
            // On the insert call (4th members interaction), capture it
            (builder as Record<string, unknown>).insert = insertSpy;
          }
          return builder;
        }
        // insert call
        const builder = makeBuilder({ data: null, error: null });
        (builder as Record<string, unknown>).insert = insertSpy;
        return builder;
      }
      if (table === 'tenants') {
        return makeBuilder({
          data: { welcome_bonus_enabled: false, welcome_bonus_points: 0 },
          error: null,
        });
      }
      return makeBuilder({ data: null, error: null });
    });

    const req = makeRequest({
      tenantId: 'tenant-uuid-1',
      firstName: 'Alice',
      referralCode: 'REF123',
    });

    await POST(req as unknown as import('next/server').NextRequest);

    // Find the insert call and verify referred_by is set
    const insertCall = insertSpy.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(insertCall).toBeDefined();
    expect(insertCall?.referred_by).toBe('referrer-uuid');
  });

  it('without referralCode: referred_by is not set in the insert call', async () => {
    const insertSpy = vi.fn(() => ({ data: null, error: null }));

    let membersCallCount = 0;
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === 'members') {
        membersCallCount++;
        const callIndex = membersCallCount;
        // All member lookups return not-found until the insert
        const notFound = makeBuilder({ data: null, error: { code: 'PGRST116', message: 'not found' } });
        if (callIndex >= 3) {
          // insert call
          (notFound as Record<string, unknown>).insert = insertSpy;
        }
        return notFound;
      }
      if (table === 'tenants') {
        return makeBuilder({
          data: { welcome_bonus_enabled: false, welcome_bonus_points: 0 },
          error: null,
        });
      }
      return makeBuilder({ data: null, error: null });
    });

    const req = makeRequest({
      tenantId: 'tenant-uuid-1',
      firstName: 'Bob',
      // no referralCode
    });

    await POST(req as unknown as import('next/server').NextRequest);

    const insertCall = insertSpy.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(insertCall).toBeDefined();
    // referred_by should not be present (spread with no referredBy means key absent)
    expect(insertCall?.referred_by).toBeUndefined();
  });
});
