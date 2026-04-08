import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@loyalty-os/lib/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@loyalty-os/email', () => ({
  buildBilingualEmail: vi.fn(() => ({ subject: 'Invite', html: '<p>body</p>' })),
  buildMemberInviteEmail: vi.fn(() => ({})),
}));

import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { GET as listMembers, POST as createMember } from '@/app/api/members/route';
import { GET as getMember, PATCH as updateMember } from '@/app/api/members/[id]/route';

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

/**
 * Creates a full Supabase query builder chain where:
 * - chaining methods (select, eq, is, or, order, limit, update, insert) return `this`
 * - terminal methods resolve with configurable values
 */
function makeQueryChain() {
  const chain: any = {};
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

/**
 * Creates a thenable chain (no .single()/.range()) for direct `await` queries,
 * e.g. `const { count } = await client.from('members').select('id', { count: 'exact', head: true }).eq(...).is(...)`
 */
function makeCountChain(count: number) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve({ data: null, count, error: null }).then(resolve, reject);
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

// ─── GET /api/members ─────────────────────────────────────────────────────────

describe('GET /api/members', () => {
  it('returns 401 when there is no active session', async () => {
    mockAuth.getSession.mockResolvedValueOnce({ data: { session: null } });

    const res = await listMembers(makeGetRequest('/api/members'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when tenant is not found', async () => {
    // Both owner and staff lookups return null
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: null, error: null }) // owner check
      .mockResolvedValueOnce({ data: null, error: null }); // staff check

    const res = await listMembers(makeGetRequest('/api/members'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Tenant not found');
  });

  it('returns paginated members list', async () => {
    const fakeMember = { id: 'm-1', name: 'Alice', email: 'alice@test.com', tenant_id: 'tenant-1' };

    // Tenant found via owner check
    mockSupabaseChain.single.mockResolvedValueOnce({ data: { id: 'tenant-1' }, error: null });
    // Service client returns members
    mockServiceChain.range.mockResolvedValueOnce({ data: [fakeMember], count: 1, error: null });

    const res = await listMembers(makeGetRequest('/api/members', { page: '1', limit: '20' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.members).toHaveLength(1);
    expect(body.members[0].name).toBe('Alice');
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.page).toBe(1);
  });

  it('finds tenant via staff lookup when owner lookup returns null', async () => {
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: null, error: null })             // owner: not found
      .mockResolvedValueOnce({ data: { tenant_id: 'tenant-2' }, error: null }); // staff: found
    mockServiceChain.range.mockResolvedValueOnce({ data: [], count: 0, error: null });

    const res = await listMembers(makeGetRequest('/api/members'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.members).toHaveLength(0);
  });
});

// ─── POST /api/members ────────────────────────────────────────────────────────

describe('POST /api/members', () => {
  it('returns 400 when name is missing', async () => {
    const res = await createMember(makePostRequest('/api/members', { email: 'alice@test.com' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Name and email are required');
  });

  it('returns 400 when email is missing', async () => {
    const res = await createMember(makePostRequest('/api/members', { name: 'Alice' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Name and email are required');
  });

  it('returns 401 when there is no active session', async () => {
    mockAuth.getSession.mockResolvedValueOnce({ data: { session: null } });

    const res = await createMember(
      makePostRequest('/api/members', { name: 'Alice', email: 'alice@test.com' })
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when tenant is not found', async () => {
    mockSupabaseChain.single.mockResolvedValueOnce({ data: null, error: null });

    const res = await createMember(
      makePostRequest('/api/members', { name: 'Alice', email: 'alice@test.com' })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Tenant not found');
  });

  it('returns 403 when subscription is not active', async () => {
    mockSupabaseChain.single.mockResolvedValueOnce({
      data: {
        id: 'tenant-1',
        slug: 'biz',
        business_name: 'My Biz',
        brand_logo_url: '',
        brand_color_primary: '#fff',
        plan: 'starter',
        plan_status: 'cancelled',
      },
      error: null,
    });

    const res = await createMember(
      makePostRequest('/api/members', { name: 'Alice', email: 'alice@test.com' })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Subscription is not active');
  });

  it('returns 403 when member limit is reached', async () => {
    mockSupabaseChain.single.mockResolvedValueOnce({
      data: {
        id: 'tenant-1',
        slug: 'biz',
        business_name: 'My Biz',
        brand_logo_url: '',
        brand_color_primary: '#fff',
        plan: 'starter',       // starter = max 500 members
        plan_status: 'active',
      },
      error: null,
    });

    // serviceClient.from('members') → count query (thenable, count = 500)
    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn().mockReturnValueOnce(makeCountChain(500)),
    });

    const res = await createMember(
      makePostRequest('/api/members', { name: 'Alice', email: 'alice@test.com' })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toMatch(/limit reached/i);
  });

  it('returns 201 with the created member', async () => {
    const newMember = {
      id: 'new-uuid',
      tenant_id: 'tenant-1',
      name: 'Alice',
      email: 'alice@test.com',
      member_code: 'BIZ-00001',
    };

    // Supabase: tenant lookup
    mockSupabaseChain.single.mockResolvedValueOnce({
      data: {
        id: 'tenant-1',
        slug: 'biz',
        business_name: 'My Biz',
        brand_logo_url: '',
        brand_color_primary: '#fff',
        plan: 'starter',
        plan_status: 'active',
      },
      error: null,
    });

    // Service: count chain (0 members) + insert chain
    const insertChain = makeQueryChain();
    insertChain.single.mockResolvedValueOnce({ data: newMember, error: null });

    (createServiceRoleClient as Mock).mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(makeCountChain(0))  // count query
        .mockReturnValueOnce(insertChain),        // insert query
    });

    const res = await createMember(
      makePostRequest('/api/members', { name: 'Alice', email: 'alice@test.com' })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.member.id).toBe('new-uuid');
    expect(body.member.name).toBe('Alice');
  });
});

// ─── PATCH /api/members/[id] ──────────────────────────────────────────────────

describe('PATCH /api/members/[id]', () => {
  it('returns 401 when there is no active session', async () => {
    mockAuth.getSession.mockResolvedValueOnce({ data: { session: null } });

    const res = await updateMember(
      makePatchRequest('/api/members/m-1', { name: 'Bob' }),
      { params: Promise.resolve({ id: 'm-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when no valid fields are provided', async () => {
    const res = await updateMember(
      makePatchRequest('/api/members/m-1', { invalid_field: 'value' }),
      { params: Promise.resolve({ id: 'm-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('No valid fields to update');
  });

  it('returns 200 with the updated member', async () => {
    const updated = { id: 'm-1', name: 'Bob Updated', email: 'bob@test.com' };
    mockServiceChain.single.mockResolvedValueOnce({ data: updated, error: null });

    const res = await updateMember(
      makePatchRequest('/api/members/m-1', { name: 'Bob Updated' }),
      { params: Promise.resolve({ id: 'm-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.member.name).toBe('Bob Updated');
  });
});
