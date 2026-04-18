import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks must be declared before imports — Vitest hoists them
vi.mock('@loyalty-os/lib/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({
  getResendMagicLinkRatelimit: vi.fn(),
}));

import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { getResendMagicLinkRatelimit } from '@/lib/ratelimit';
import { POST } from '@/app/api/auth/resend-magic-link/route';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeRequest(body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/resend-magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function makeRatelimitMock(success: boolean, resetOffsetMs = 300_000) {
  return {
    limit: vi.fn().mockResolvedValue({
      success,
      reset: Date.now() + resetOffsetMs,
    }),
  };
}

// ─── SHARED MOCK STATE ────────────────────────────────────────────────────────

let mockSignInWithOtp: Mock;

beforeEach(() => {
  vi.clearAllMocks();

  mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });

  (createServiceRoleClient as Mock).mockReturnValue({
    auth: { signInWithOtp: mockSignInWithOtp },
  });

  // Default: no rate limiting
  (getResendMagicLinkRatelimit as Mock).mockReturnValue(null);
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/resend-magic-link', () => {
  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when email format is invalid', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeTruthy();
  });

  it('returns 429 with Retry-After header when rate limited', async () => {
    (getResendMagicLinkRatelimit as Mock).mockReturnValue(
      makeRatelimitMock(false, 300_000),
    );

    const res = await POST(makeRequest({ email: 'user@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    const retryAfter = Number(res.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(body.error).toBeTruthy();
  });

  it('returns 200 with { sent: true, method: "magiclink" } by default', async () => {
    const res = await POST(makeRequest({ email: 'user@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(true);
    expect(body.method).toBe('magiclink');
  });

  it('returns 200 with { sent: true, method: "otp" } when type is "otp"', async () => {
    const res = await POST(makeRequest({ email: 'user@example.com', type: 'otp' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(true);
    expect(body.method).toBe('otp');
  });

  it('does not pass emailRedirectTo when type is "otp"', async () => {
    await POST(makeRequest({ email: 'user@example.com', type: 'otp' }));

    const callArgs = mockSignInWithOtp.mock.calls[0][0];
    expect(callArgs.options?.emailRedirectTo).toBeUndefined();
  });

  it('passes emailRedirectTo when type is "magiclink"', async () => {
    await POST(makeRequest({ email: 'user@example.com', type: 'magiclink' }));

    const callArgs = mockSignInWithOtp.mock.calls[0][0];
    expect(callArgs.options?.emailRedirectTo).toContain('/auth/callback');
  });

  it('passes shouldCreateUser: false to signInWithOtp', async () => {
    await POST(makeRequest({ email: 'user@example.com' }));

    const callArgs = mockSignInWithOtp.mock.calls[0][0];
    expect(callArgs.options?.shouldCreateUser).toBe(false);
  });

  it('returns 500 when signInWithOtp returns an error', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: new Error('Supabase error') });

    const res = await POST(makeRequest({ email: 'user@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeTruthy();
    // Must never leak raw error message
    expect(body.error).not.toContain('Supabase');
  });

  it('proceeds past rate limiter when it allows the request', async () => {
    (getResendMagicLinkRatelimit as Mock).mockReturnValue(
      makeRatelimitMock(true),
    );

    const res = await POST(makeRequest({ email: 'user@example.com' }));
    expect(res.status).toBe(200);
  });
});
