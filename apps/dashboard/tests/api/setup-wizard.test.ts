import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks must be declared before imports — Vitest hoists them
vi.mock('@loyalty-os/lib/server', () => ({
  getAuthedUser: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}));

import { getAuthedUser, createServerSupabaseClient } from '@loyalty-os/lib/server';
import { GET, PATCH } from '@/app/api/setup-wizard/route';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeQueryChain() {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain as {
    select: Mock; eq: Mock; update: Mock; single: Mock;
  };
}

function makePatchRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/setup-wizard', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const TENANT_DATA = {
  id: 'tenant-uuid',
  setup_wizard_completed_at: null,
  setup_wizard_dismissed_at: null,
  business_name: 'Test Biz',
  brand_color_primary: '#7c3aed',
  points_per_dollar: 1,
  welcome_bonus_points: 100,
};

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/setup-wizard ───────────────────────────────────────────────────

describe('GET /api/setup-wizard', () => {
  it('returns 401 when no user', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when no tenant', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValue(chain),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Tenant not found');
  });

  it('returns 200 with completedAt, dismissedAt and prefill', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({ data: TENANT_DATA, error: null });

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValue(chain),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.completedAt).toBeNull();
    expect(body.dismissedAt).toBeNull();
    expect(body.prefill).toEqual({
      businessName: 'Test Biz',
      primaryColor: '#7c3aed',
      pointsPerDollar: 1,
      welcomeBonusPoints: 100,
    });
  });
});

// ─── PATCH /api/setup-wizard ─────────────────────────────────────────────────

describe('PATCH /api/setup-wizard', () => {
  it('returns 401 when no user', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce(null);

    const res = await PATCH(makePatchRequest({ action: 'complete' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when no tenant', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValue(chain),
    });

    const res = await PATCH(makePatchRequest({ action: 'complete' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Tenant not found');
  });

  it('returns 400 for invalid action', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const res = await PATCH(makePatchRequest({ action: 'invalid_action' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });

  it('returns 200 and stamps setup_wizard_completed_at for complete action', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const selectChain = makeQueryChain();
    selectChain.single.mockResolvedValueOnce({ data: { id: 'tenant-uuid' }, error: null });

    const updateChain = makeQueryChain();

    const fromMock = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain);

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: fromMock });

    const res = await PATCH(makePatchRequest({ action: 'complete' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ setup_wizard_completed_at: expect.any(String) })
    );
  });

  it('returns 200 and stamps setup_wizard_dismissed_at for dismiss action', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const selectChain = makeQueryChain();
    selectChain.single.mockResolvedValueOnce({ data: { id: 'tenant-uuid' }, error: null });

    const updateChain = makeQueryChain();

    const fromMock = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain);

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: fromMock });

    const res = await PATCH(makePatchRequest({ action: 'dismiss' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ setup_wizard_dismissed_at: expect.any(String) })
    );
  });
});
