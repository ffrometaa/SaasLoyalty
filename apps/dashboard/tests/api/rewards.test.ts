import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@loyalty-os/lib/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { GET as listRewards, POST as createReward } from '@/app/api/rewards/route';
import { DELETE as deleteReward, PATCH as updateReward } from '@/app/api/rewards/[id]/route';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeGetRequest(path: string, params?: Record<string, string>): NextRequest {
  const url = new URL(`http://localhost${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

function makePostRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, { method: 'DELETE' });
}

/**
 * Chainable Supabase query builder mock.
 * Chaining methods return `this`; terminal methods resolve with configurable values.
 */
interface MockQueryChain {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
}

function makeQueryChain(): MockQueryChain {
  const chain = {} as MockQueryChain;
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.range = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
  chain.upsert = vi.fn().mockResolvedValue({ data: null, error: null });
  return chain;
}

interface MockThenableChain {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise<unknown>;
}

/**
 * Creates a thenable chain for direct-await queries (no .single()/.range() terminal).
 * Used for soft-delete: `await serviceClient.from('rewards').update({...}).eq('id', id)`
 */
function makeThenableChain(result: Record<string, unknown>): MockThenableChain {
  const chain = {} as MockThenableChain;
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

// ─── SHARED MOCK STATE ────────────────────────────────────────────────────────

let mockAuth: { getSession: Mock };
let mockSupabaseChain: ReturnType<typeof makeQueryChain>;
let mockServiceChain: ReturnType<typeof makeQueryChain>;

beforeEach(() => {
  vi.clearAllMocks();

  mockAuth = {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-uuid', email: 'admin@example.com' } } },
    }),
  };

  mockSupabaseChain = makeQueryChain();
  mockServiceChain = makeQueryChain();

  (createServerSupabaseClient as Mock).mockResolvedValue({
    auth: mockAuth,
    from: vi.fn().mockReturnValue(mockSupabaseChain),
  });

  (createServiceRoleClient as Mock).mockReturnValue({
    from: vi.fn().mockReturnValue(mockServiceChain),
  });
});

// ─── GET /api/rewards ─────────────────────────────────────────────────────────

describe('GET /api/rewards', () => {
  it('returns 401 when there is no active session', async () => {
    mockAuth.getSession.mockResolvedValueOnce({ data: { session: null } });

    const res = await listRewards(makeGetRequest('/api/rewards'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when tenant is not found', async () => {
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: null, error: null }) // owner check
      .mockResolvedValueOnce({ data: null, error: null }); // staff check

    const res = await listRewards(makeGetRequest('/api/rewards'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Tenant not found');
  });

  it('returns paginated rewards list', async () => {
    const fakeReward = { id: 'r-1', name: 'Free Coffee', points_required: 100, tenant_id: 'tenant-1' };

    // GET rewards uses `supabase` (not serviceClient) for both tenant and rewards queries
    mockSupabaseChain.single.mockResolvedValueOnce({ data: { id: 'tenant-1' }, error: null });
    mockSupabaseChain.range.mockResolvedValueOnce({ data: [fakeReward], count: 1, error: null });

    const res = await listRewards(makeGetRequest('/api/rewards', { page: '1', limit: '20' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rewards).toHaveLength(1);
    expect(body.rewards[0].name).toBe('Free Coffee');
    expect(body.pagination.total).toBe(1);
  });

  it('returns empty list with correct pagination structure', async () => {
    mockSupabaseChain.single.mockResolvedValueOnce({ data: { id: 'tenant-1' }, error: null });
    mockSupabaseChain.range.mockResolvedValueOnce({ data: [], count: 0, error: null });

    const res = await listRewards(makeGetRequest('/api/rewards'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rewards).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
    expect(body.pagination.totalPages).toBe(0);
  });
});

// ─── POST /api/rewards ────────────────────────────────────────────────────────

describe('POST /api/rewards', () => {
  it('returns 400 when name is missing', async () => {
    const res = await createReward(makePostRequest('/api/rewards', { points_required: 100 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Name and points required are required');
  });

  it('returns 400 when points_required is missing', async () => {
    const res = await createReward(makePostRequest('/api/rewards', { name: 'Free Coffee' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Name and points required are required');
  });

  it('returns 400 when points_required is negative', async () => {
    const res = await createReward(
      makePostRequest('/api/rewards', { name: 'Free Coffee', points_required: -10 })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Points required must be greater than 0');
  });

  it('returns 401 when there is no active session', async () => {
    mockAuth.getSession.mockResolvedValueOnce({ data: { session: null } });

    const res = await createReward(
      makePostRequest('/api/rewards', { name: 'Free Coffee', points_required: 100 })
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when tenant is not found', async () => {
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: null, error: null }) // owner
      .mockResolvedValueOnce({ data: null, error: null }); // staff

    const res = await createReward(
      makePostRequest('/api/rewards', { name: 'Free Coffee', points_required: 100 })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Tenant not found');
  });

  it('returns 201 with the created reward', async () => {
    const newReward = { id: 'r-new', name: 'Free Coffee', points_required: 100, tenant_id: 'tenant-1' };

    mockSupabaseChain.single.mockResolvedValueOnce({ data: { id: 'tenant-1' }, error: null });
    mockServiceChain.single.mockResolvedValueOnce({ data: newReward, error: null });

    const res = await createReward(
      makePostRequest('/api/rewards', { name: 'Free Coffee', points_required: 100 })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.reward.id).toBe('r-new');
    expect(body.reward.name).toBe('Free Coffee');
  });
});

// ─── PATCH /api/rewards/[id] ──────────────────────────────────────────────────

describe('PATCH /api/rewards/[id]', () => {
  it('returns 400 when no valid fields are provided', async () => {
    const res = await updateReward(
      makePatchRequest('/api/rewards/r-1', { invalid_field: true }),
      { params: Promise.resolve({ id: 'r-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('No valid fields to update');
  });

  it('returns 200 with the updated reward', async () => {
    const updated = { id: 'r-1', name: 'Updated Coffee', points_required: 150 };
    mockServiceChain.single.mockResolvedValueOnce({ data: updated, error: null });

    const res = await updateReward(
      makePatchRequest('/api/rewards/r-1', { name: 'Updated Coffee', points_required: 150 }),
      { params: Promise.resolve({ id: 'r-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.reward.name).toBe('Updated Coffee');
  });
});

// ─── DELETE /api/rewards/[id] ─────────────────────────────────────────────────

describe('DELETE /api/rewards/[id]', () => {
  it('returns { success: true } on successful soft delete', async () => {
    // serviceClient.from('rewards').update({...}).eq('id', id) — awaited directly
    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableChain({ error: null })),
    });

    const res = await deleteReward(
      makeDeleteRequest('/api/rewards/r-1'),
      { params: Promise.resolve({ id: 'r-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 500 when the DB update fails', async () => {
    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn().mockReturnValue(
        makeThenableChain({ error: { message: 'DB connection error' } })
      ),
    });

    const res = await deleteReward(
      makeDeleteRequest('/api/rewards/r-1'),
      { params: Promise.resolve({ id: 'r-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to delete reward');
  });
});
