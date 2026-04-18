import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Supabase client mocks — set up before importing the module under test
// ---------------------------------------------------------------------------

function makeBuilder(terminalResult: unknown) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.single = vi.fn(() => terminalResult);
  builder.order = vi.fn(chain);
  return builder;
}

// Mutable stubs — tests override these per case
let mockGetUser: ReturnType<typeof vi.fn>;
let mockFrom: ReturnType<typeof vi.fn>;

vi.mock('@loyalty-os/lib/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
      from: (...args: unknown[]) => mockFrom(...args),
    })
  ),
}));

// Import AFTER mocks
import { GET } from '@/app/api/redemptions/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(search = ''): Request {
  return new Request(`http://localhost/api/member/redemptions${search}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

const MEMBER_ROW = { id: 'member-uuid-1' };
const USER = { id: 'user-uuid-1' };

const REDEMPTIONS = [
  {
    id: 'red-1',
    reward_name: 'Free Coffee',
    status: 'pending',
    alphanumeric_code: 'MY-AB12',
    qr_code: '{"type":"redemption"}',
    expires_at: '2026-05-01T00:00:00Z',
    used_at: null,
    rewards: { name: 'Free Coffee', description: null },
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/member/redemptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user with a matching member row
    mockGetUser = vi.fn().mockResolvedValue({ data: { user: USER }, error: null });

    mockFrom = vi.fn((table: string) => {
      if (table === 'members') {
        return makeBuilder({ data: MEMBER_ROW, error: null });
      }
      if (table === 'redemptions') {
        // order() is terminal-ish — needs to resolve directly
        const builder = makeBuilder({ data: REDEMPTIONS, error: null });
        (builder as Record<string, unknown>).order = vi.fn(() => ({
          data: REDEMPTIONS,
          error: null,
        }));
        return builder;
      }
      return makeBuilder({ data: null, error: null });
    });
  });

  it('authenticated user with member row → 200 with redemptions list', async () => {
    const req = makeRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redemptions).toBeDefined();
    expect(Array.isArray(body.redemptions)).toBe(true);
  });

  it('no session (getUser returns null user) → 401', async () => {
    mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

    const req = makeRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('session exists but no member row → 404', async () => {
    mockFrom = vi.fn((table: string) => {
      if (table === 'members') {
        // single() returns null data — no matching member
        return makeBuilder({ data: null, error: null });
      }
      return makeBuilder({ data: null, error: null });
    });

    const req = makeRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Member not found');
  });

  it('status filter ?status=pending → query includes .eq("status", "pending")', async () => {
    // Track all .eq() calls on the redemptions builder
    const redemptionEqCalls: Array<[string, unknown]> = [];

    mockFrom = vi.fn((table: string) => {
      if (table === 'members') {
        return makeBuilder({ data: MEMBER_ROW, error: null });
      }
      if (table === 'redemptions') {
        // Build a fully chainable builder where eq() records args and returns itself
        const builder: Record<string, unknown> = {};
        const chain = () => builder;
        builder.select = vi.fn(chain);
        builder.eq = vi.fn((col: string, val: unknown) => {
          redemptionEqCalls.push([col, val]);
          return builder;
        });
        builder.order = vi.fn(() => ({ data: REDEMPTIONS, error: null }));
        return builder;
      }
      return makeBuilder({ data: null, error: null });
    });

    const req = makeRequest('?status=pending');
    await GET(req as unknown as import('next/server').NextRequest);

    // Verify .eq('status', 'pending') was called on the redemptions query
    expect(redemptionEqCalls).toContainEqual(['status', 'pending']);
  });
});
