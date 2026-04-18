import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks must be declared before imports — Vitest hoists them
vi.mock('@loyalty-os/lib/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('stripe', () => {
  const mockRetrieve = vi.fn();
  const MockStripe = vi.fn().mockImplementation(() => ({
    checkout: { sessions: { retrieve: mockRetrieve } },
  }));
  // Expose retrieve so tests can control it
  (MockStripe as unknown as { _mockRetrieve: Mock })._mockRetrieve = mockRetrieve;
  return { default: MockStripe };
});

import Stripe from 'stripe';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { GET } from '@/app/api/auth/stripe-success/route';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const WEB_URL = 'https://app.test';

function makeRequest(sessionId?: string): NextRequest {
  const url = sessionId
    ? `http://dashboard.test/api/auth/stripe-success?session_id=${sessionId}`
    : 'http://dashboard.test/api/auth/stripe-success';
  return new NextRequest(url);
}

function getStripeRetrieveMock(): Mock {
  return (Stripe as unknown as { _mockRetrieve: Mock })._mockRetrieve;
}

function makeAdminGenerateLinkMock(result: {
  data: { properties?: { action_link?: string } } | null;
  error: Error | null;
}) {
  return {
    admin: {
      generateLink: vi.fn().mockResolvedValue(result),
    },
  };
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_WEB_URL', WEB_URL);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('GET /api/auth/stripe-success', () => {
  it('redirects to /registration-complete (no email) when session_id is missing', async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${WEB_URL}/registration-complete`);
  });

  it('redirects to /registration-complete (no email) when Stripe session has no email', async () => {
    getStripeRetrieveMock().mockResolvedValueOnce({
      customer_email: null,
      customer_details: { email: null },
    });

    const res = await GET(makeRequest('sess_nomail'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${WEB_URL}/registration-complete`);
  });

  it('redirects to /registration-complete?email=... when magic link generation fails', async () => {
    getStripeRetrieveMock().mockResolvedValueOnce({
      customer_email: 'owner@example.com',
      customer_details: null,
    });

    (createServiceRoleClient as Mock).mockReturnValueOnce({
      auth: makeAdminGenerateLinkMock({ data: null, error: new Error('Auth error') }),
    });

    const res = await GET(makeRequest('sess_magicfail'));

    expect(res.status).toBe(307);
    const location = res.headers.get('location')!;
    expect(location).toContain(`${WEB_URL}/registration-complete`);
    expect(location).toContain('email=owner%40example.com');
  });

  it('redirects to /registration-complete?email=... when action_link is missing', async () => {
    getStripeRetrieveMock().mockResolvedValueOnce({
      customer_email: 'owner@example.com',
      customer_details: null,
    });

    (createServiceRoleClient as Mock).mockReturnValueOnce({
      auth: makeAdminGenerateLinkMock({ data: { properties: {} }, error: null }),
    });

    const res = await GET(makeRequest('sess_nolink'));

    expect(res.status).toBe(307);
    const location = res.headers.get('location')!;
    expect(location).toContain(`${WEB_URL}/registration-complete`);
    expect(location).toContain('email=');
  });

  it('redirects to /registration-complete (no email) when Stripe throws', async () => {
    getStripeRetrieveMock().mockRejectedValueOnce(new Error('Stripe network error'));

    const res = await GET(makeRequest('sess_throw'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${WEB_URL}/registration-complete`);
  });

  it('redirects to action_link on happy path', async () => {
    const actionLink = 'https://supabase.co/auth/v1/magiclink?token=abc123';

    getStripeRetrieveMock().mockResolvedValueOnce({
      customer_email: 'owner@example.com',
      customer_details: null,
    });

    (createServiceRoleClient as Mock).mockReturnValueOnce({
      auth: makeAdminGenerateLinkMock({
        data: { properties: { action_link: actionLink } },
        error: null,
      }),
    });

    const res = await GET(makeRequest('sess_happy'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(actionLink);
  });

  it('falls back to default webUrl when NEXT_PUBLIC_WEB_URL is not set', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEB_URL', '');

    const res = await GET(makeRequest());

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/registration-complete');
    expect(res.headers.get('location')).not.toContain(WEB_URL);
  });
});
