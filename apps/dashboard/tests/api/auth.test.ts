import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks must be declared before imports — Vitest hoists them
vi.mock('@loyalty-os/lib/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@loyalty-os/email', () => ({
  buildBilingualEmail: vi.fn(() => ({ subject: 'OTP Subject', html: '<p>body</p>' })),
  buildOtpVerificationEmail: vi.fn(() => ({
    enSubject: 'Verify your device',
    esSubject: 'Verificá tu dispositivo',
    enHtmlContent: '<p>en</p>',
    esHtmlContent: '<p>es</p>',
  })),
}));

import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';
import { POST as checkDevice } from '@/app/api/auth/check-device/route';
import { POST as verifyOtp } from '@/app/api/auth/verify-otp/route';
import { POST as sendOtp } from '@/app/api/auth/send-otp/route';
import { POST as signout } from '@/app/api/auth/signout/route';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeRequest(path: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Creates a chainable Supabase query builder mock.
 * All chaining methods return `this`. Terminal methods resolve to { data, error }.
 * Override `single` per-test to control what the DB "returns".
 */
function makeQueryChain() {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain as {
    select: Mock; eq: Mock; is: Mock; order: Mock; limit: Mock;
    update: Mock; upsert: Mock; insert: Mock; single: Mock;
  };
}

// ─── SHARED MOCK STATE ────────────────────────────────────────────────────────

let mockAuth: { getSession: Mock; signOut: Mock };
let mockChain: ReturnType<typeof makeQueryChain>;

beforeEach(() => {
  vi.clearAllMocks();

  mockAuth = {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-uuid', email: 'admin@example.com' } } },
    }),
    signOut: vi.fn().mockResolvedValue({}),
  };

  mockChain = makeQueryChain();

  (createServerSupabaseClient as Mock).mockResolvedValue({ auth: mockAuth });
  (createServiceRoleClient as Mock).mockReturnValue({ from: vi.fn().mockReturnValue(mockChain) });
});

// ─── POST /api/auth/check-device ──────────────────────────────────────────────

describe('POST /api/auth/check-device', () => {
  it('returns { trusted: false } when device_id is missing', async () => {
    const res = await checkDevice(makeRequest('/api/auth/check-device', {}));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.trusted).toBe(false);
  });

  it('returns 401 when there is no active session', async () => {
    mockAuth.getSession.mockResolvedValueOnce({ data: { session: null } });

    const res = await checkDevice(makeRequest('/api/auth/check-device', { device_id: 'dev-1' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns { trusted: true } for demo accounts (@loyaltyos.com) without hitting DB', async () => {
    mockAuth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'demo-uuid', email: 'demo@loyaltyos.com' } } },
    });

    const res = await checkDevice(makeRequest('/api/auth/check-device', { device_id: 'dev-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.trusted).toBe(true);
    // DB should never be queried for demo accounts
    expect(createServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns { trusted: true } when device is found in trusted_devices', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { id: 'device-row-id' }, error: null });

    const res = await checkDevice(makeRequest('/api/auth/check-device', { device_id: 'dev-known' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.trusted).toBe(true);
  });

  it('returns { trusted: false } when device is not in trusted_devices', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: null });

    const res = await checkDevice(makeRequest('/api/auth/check-device', { device_id: 'dev-unknown' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.trusted).toBe(false);
  });
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────

describe('POST /api/auth/verify-otp', () => {
  it('returns 400 when otp_code is missing', async () => {
    const res = await verifyOtp(makeRequest('/api/auth/verify-otp', { device_id: 'dev-1' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Missing required fields');
  });

  it('returns 400 when device_id is missing', async () => {
    const res = await verifyOtp(makeRequest('/api/auth/verify-otp', { otp_code: '123456' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Missing required fields');
  });

  it('returns 401 when there is no active session', async () => {
    mockAuth.getSession.mockResolvedValueOnce({ data: { session: null } });

    const res = await verifyOtp(makeRequest('/api/auth/verify-otp', { otp_code: '123456', device_id: 'dev-1' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when there is no pending OTP in DB', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: null });

    const res = await verifyOtp(makeRequest('/api/auth/verify-otp', { otp_code: '123456', device_id: 'dev-1' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('No pending OTP found');
  });

  it('returns 400 when OTP has expired', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: {
        id: 'otp-id',
        otp_code: '123456',
        expires_at: new Date(Date.now() - 60_000).toISOString(), // 1 minute in the past
      },
      error: null,
    });

    const res = await verifyOtp(makeRequest('/api/auth/verify-otp', { otp_code: '123456', device_id: 'dev-1' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('OTP has expired');
  });

  it('returns 400 when OTP code does not match', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: {
        id: 'otp-id',
        otp_code: '999999',
        expires_at: new Date(Date.now() + 600_000).toISOString(),
      },
      error: null,
    });

    const res = await verifyOtp(makeRequest('/api/auth/verify-otp', { otp_code: '123456', device_id: 'dev-1' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid OTP code');
  });

  it('returns { verified: true } with a correct, non-expired OTP', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: {
        id: 'otp-id',
        otp_code: '123456',
        expires_at: new Date(Date.now() + 600_000).toISOString(),
      },
      error: null,
    });

    const res = await verifyOtp(makeRequest('/api/auth/verify-otp', { otp_code: '123456', device_id: 'dev-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.verified).toBe(true);
  });

  it('trims whitespace from otp_code before comparing', async () => {
    mockChain.single.mockResolvedValueOnce({
      data: {
        id: 'otp-id',
        otp_code: '123456',
        expires_at: new Date(Date.now() + 600_000).toISOString(),
      },
      error: null,
    });

    const res = await verifyOtp(makeRequest('/api/auth/verify-otp', { otp_code: '  123456  ', device_id: 'dev-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.verified).toBe(true);
  });
});

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────

describe('POST /api/auth/send-otp', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns 401 when there is no active session', async () => {
    mockAuth.getSession.mockResolvedValueOnce({ data: { session: null } });

    const res = await sendOtp(makeRequest('/api/auth/send-otp'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 when RESEND_API_KEY is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', ''); // override to empty (falsy)

    const res = await sendOtp(makeRequest('/api/auth/send-otp'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Email service not configured');
  });

  it('returns { sent: true, email } when OTP email is sent successfully', async () => {
    const res = await sendOtp(makeRequest('/api/auth/send-otp'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(true);
    expect(body.email).toBe('admin@example.com');
  });

  it('calls Resend API with correct Authorization header', async () => {
    await sendOtp(makeRequest('/api/auth/send-otp'));

    const mockFetch = (globalThis.fetch as Mock);
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.headers.Authorization).toBe('Bearer test-resend-key');
  });

  it('returns 500 when Resend API responds with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('Rate limit exceeded'),
    }));

    const res = await sendOtp(makeRequest('/api/auth/send-otp'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to send email');
  });
});

// ─── POST /api/auth/signout ───────────────────────────────────────────────────

describe('POST /api/auth/signout', () => {
  it('calls signOut and redirects to /login', async () => {
    const res = await signout(makeRequest('/api/auth/signout'));

    expect(mockAuth.signOut).toHaveBeenCalledOnce();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });
});
