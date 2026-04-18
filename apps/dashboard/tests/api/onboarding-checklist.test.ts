import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks must be declared before imports — Vitest hoists them
vi.mock('@loyalty-os/lib/server', () => ({
  getAuthedUser: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}));

import { getAuthedUser, createServerSupabaseClient } from '@loyalty-os/lib/server';
import { GET, PATCH } from '@/app/api/onboarding-checklist/route';

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
  return new NextRequest('http://localhost/api/onboarding-checklist', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const TENANT_DATA = {
  id: 'tenant-uuid',
  plan_status: 'trialing',
  onboarding_completed_at: null,
  onboarding_dismissed_at: null,
  onboarding_reward_shared_at: null,
  setup_wizard_completed_at: null,
};

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/onboarding-checklist ───────────────────────────────────────────

describe('GET /api/onboarding-checklist', () => {
  it('returns 401 when no user', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when tenant not found', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantChain = makeQueryChain();
    tenantChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValue(tenantChain),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Tenant not found');
  });

  it('reward_created is false when reward count is 0', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantChain = makeQueryChain();
    tenantChain.single.mockResolvedValueOnce({ data: TENANT_DATA, error: null });

    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
    };

    const fromMock = vi.fn()
      .mockReturnValueOnce(tenantChain)   // tenants
      .mockReturnValueOnce(countChain)    // rewards
      .mockReturnValueOnce(countChain);   // members

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: fromMock });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.steps.reward_created).toBe(false);
    expect(body.steps.member_invited).toBe(false);
    expect(body.setupWizardCompleted).toBe(false);
  });

  it('reward_created is true when reward count > 0', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantChain = makeQueryChain();
    tenantChain.single.mockResolvedValueOnce({ data: TENANT_DATA, error: null });

    const rewardsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
    };
    const membersChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
    };

    const fromMock = vi.fn()
      .mockReturnValueOnce(tenantChain)
      .mockReturnValueOnce(rewardsChain)
      .mockReturnValueOnce(membersChain);

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: fromMock });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.steps.reward_created).toBe(true);
    expect(body.steps.member_invited).toBe(false);
  });

  it('allDone=true and auto-completes when all steps done and onboarding_completed_at is null', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantData = {
      ...TENANT_DATA,
      onboarding_reward_shared_at: '2026-04-17T10:00:00Z',
    };

    const tenantChain = makeQueryChain();
    tenantChain.single.mockResolvedValueOnce({ data: tenantData, error: null });

    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
    };

    const updateChain = makeQueryChain();

    const fromMock = vi.fn()
      .mockReturnValueOnce(tenantChain)   // tenants select
      .mockReturnValueOnce(countChain)    // rewards count
      .mockReturnValueOnce(countChain)    // members count
      .mockReturnValueOnce(updateChain);  // tenants update

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: fromMock });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.allDone).toBe(true);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_completed_at: expect.any(String) })
    );
  });

  it('isDismissed=true when onboarding_dismissed_at is set', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantData = { ...TENANT_DATA, onboarding_dismissed_at: '2026-04-10T10:00:00Z' };
    const tenantChain = makeQueryChain();
    tenantChain.single.mockResolvedValueOnce({ data: tenantData, error: null });

    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
    };

    const fromMock = vi.fn()
      .mockReturnValueOnce(tenantChain)
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(countChain);

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: fromMock });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isDismissed).toBe(true);
  });

  it('setupWizardCompleted=false when setup_wizard_completed_at is null', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantChain = makeQueryChain();
    tenantChain.single.mockResolvedValueOnce({ data: TENANT_DATA, error: null });

    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
    };

    const fromMock = vi.fn()
      .mockReturnValueOnce(tenantChain)
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(countChain);

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: fromMock });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.setupWizardCompleted).toBe(false);
  });

  it('setupWizardCompleted=true when setup_wizard_completed_at is set', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const tenantData = { ...TENANT_DATA, setup_wizard_completed_at: '2026-04-17T12:00:00Z' };
    const tenantChain = makeQueryChain();
    tenantChain.single.mockResolvedValueOnce({ data: tenantData, error: null });

    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
    };

    const fromMock = vi.fn()
      .mockReturnValueOnce(tenantChain)
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(countChain);

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: fromMock });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.setupWizardCompleted).toBe(true);
  });
});

// ─── PATCH /api/onboarding-checklist ─────────────────────────────────────────

describe('PATCH /api/onboarding-checklist', () => {
  it('returns 400 for invalid action', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const res = await PATCH(makePatchRequest({ action: 'invalid_action' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });

  it('returns 401 when no user', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce(null);

    const res = await PATCH(makePatchRequest({ action: 'dismiss' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when tenant not found', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const chain = makeQueryChain();
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({
      from: vi.fn().mockReturnValue(chain),
    });

    const res = await PATCH(makePatchRequest({ action: 'dismiss' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Tenant not found');
  });

  it('returns 200 and sets onboarding_dismissed_at for dismiss action', async () => {
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
      expect.objectContaining({ onboarding_dismissed_at: expect.any(String) })
    );
  });

  it('returns 200 and sets onboarding_reward_shared_at for mark_shared action', async () => {
    (getAuthedUser as Mock).mockResolvedValueOnce({ id: 'user-1' });

    const selectChain = makeQueryChain();
    selectChain.single.mockResolvedValueOnce({ data: { id: 'tenant-uuid' }, error: null });

    const updateChain = makeQueryChain();

    const fromMock = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain);

    (createServerSupabaseClient as Mock).mockResolvedValueOnce({ from: fromMock });

    const res = await PATCH(makePatchRequest({ action: 'mark_shared' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_reward_shared_at: expect.any(String) })
    );
  });
});
