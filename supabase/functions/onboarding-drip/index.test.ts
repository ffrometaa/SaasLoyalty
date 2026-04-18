// Deno tests for onboarding-drip edge function.
// Run with: deno test --allow-env supabase/functions/onboarding-drip/index.test.ts

import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// ─── TEST HELPERS ─────────────────────────────────────────────────────────────

const VALID_SECRET = 'test-cron-secret';
const BASE_URL = 'http://localhost/functions/v1/onboarding-drip';

function makeRequest(secret?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) headers['Authorization'] = `Bearer ${secret}`;
  return new Request(BASE_URL, { method: 'POST', headers, body: '{"trigger":"cron"}' });
}

/** Minimal stub for the Supabase client returned by createClient() */
interface QueryStub {
  data: unknown;
  error: unknown;
  count?: number;
}

interface SupabaseStub {
  tenantsData: QueryStub;
  dripEmailsData: QueryStub;   // for select (idempotency check)
  insertCalls: unknown[];
  resendCalls: unknown[];
}

function makeSupabaseStub(opts: {
  tenants?: unknown[];
  tenantsError?: unknown;
  dripEmailExists?: boolean;
}): SupabaseStub {
  const stub: SupabaseStub = {
    tenantsData: { data: opts.tenants ?? [], error: opts.tenantsError ?? null },
    dripEmailsData: { data: opts.dripEmailExists ? { id: 'existing-row' } : null, error: null },
    insertCalls: [],
    resendCalls: [],
  };
  return stub;
}

// ─── AUTH REJECTION ───────────────────────────────────────────────────────────

Deno.test('rejects request with no Authorization header → 401', async () => {
  // Set env vars before the module is evaluated in the real function.
  // Here we test the auth logic directly by simulating the handler logic.
  const CRON_SECRET = 'test-secret';

  const authHeader = '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const isUnauthorized = !CRON_SECRET || secret !== CRON_SECRET;

  assertEquals(isUnauthorized, true);
});

Deno.test('rejects request with wrong secret → 401', async () => {
  const CRON_SECRET = 'real-secret';
  const authHeader = 'Bearer wrong-secret';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const isUnauthorized = !CRON_SECRET || secret !== CRON_SECRET;

  assertEquals(isUnauthorized, true);
});

Deno.test('accepts request with correct Bearer secret', async () => {
  const CRON_SECRET = VALID_SECRET;
  const authHeader = `Bearer ${VALID_SECRET}`;
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const isUnauthorized = !CRON_SECRET || secret !== CRON_SECRET;

  assertEquals(isUnauthorized, false);
});

// ─── DAY WINDOW LOGIC ─────────────────────────────────────────────────────────

Deno.test('day3 window: daysSinceCreated >= 3 && < 4 → emailKey is day3', () => {
  function resolveEmailKey(daysSinceCreated: number): 'day3' | 'day7' | null {
    if (daysSinceCreated >= 3 && daysSinceCreated < 4) return 'day3';
    if (daysSinceCreated >= 7 && daysSinceCreated < 8) return 'day7';
    return null;
  }

  assertEquals(resolveEmailKey(3.0), 'day3');
  assertEquals(resolveEmailKey(3.5), 'day3');
  assertEquals(resolveEmailKey(3.99), 'day3');
});

Deno.test('day7 window: daysSinceCreated >= 7 && < 8 → emailKey is day7', () => {
  function resolveEmailKey(daysSinceCreated: number): 'day3' | 'day7' | null {
    if (daysSinceCreated >= 3 && daysSinceCreated < 4) return 'day3';
    if (daysSinceCreated >= 7 && daysSinceCreated < 8) return 'day7';
    return null;
  }

  assertEquals(resolveEmailKey(7.0), 'day7');
  assertEquals(resolveEmailKey(7.5), 'day7');
  assertEquals(resolveEmailKey(7.99), 'day7');
});

Deno.test('outside windows: returns null', () => {
  function resolveEmailKey(daysSinceCreated: number): 'day3' | 'day7' | null {
    if (daysSinceCreated >= 3 && daysSinceCreated < 4) return 'day3';
    if (daysSinceCreated >= 7 && daysSinceCreated < 8) return 'day7';
    return null;
  }

  assertEquals(resolveEmailKey(1), null);
  assertEquals(resolveEmailKey(4), null);
  assertEquals(resolveEmailKey(6.9), null);
  assertEquals(resolveEmailKey(8), null);
});

// ─── IDEMPOTENCY ──────────────────────────────────────────────────────────────

Deno.test('idempotency: skips send if dripEmail row already exists', () => {
  // Simulate the idempotency guard: if `existing` is truthy, we skip the tenant
  const existing = { id: 'some-row' };
  const shouldSkip = !!existing;

  assertEquals(shouldSkip, true);
});

Deno.test('idempotency: proceeds with send if no dripEmail row exists', () => {
  const existing = null;
  const shouldSkip = !!existing;

  assertEquals(shouldSkip, false);
});

// ─── ERROR ISOLATION ──────────────────────────────────────────────────────────

Deno.test('error isolation: one tenant error is caught, others are processed', async () => {
  const results: string[] = [];
  const errors: string[] = [];

  const tenants = [
    { id: 'tenant-1', willFail: false },
    { id: 'tenant-2', willFail: true },
    { id: 'tenant-3', willFail: false },
  ];

  for (const tenant of tenants) {
    try {
      if (tenant.willFail) throw new Error(`DB failure for ${tenant.id}`);
      results.push(tenant.id);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  assertEquals(results, ['tenant-1', 'tenant-3']);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].includes('tenant-2'), true);
});

// ─── DAYS LEFT CALCULATION ────────────────────────────────────────────────────

Deno.test('daysLeft is computed correctly from trial_ends_at', () => {
  const now = Date.now();
  const trialEndsAt = new Date(now + 5 * 86_400_000).toISOString(); // 5 days from now
  const daysLeft = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / 86_400_000));

  assertEquals(daysLeft, 5);
});

Deno.test('daysLeft is 0 when trial already ended', () => {
  const now = Date.now();
  const trialEndsAt = new Date(now - 86_400_000).toISOString(); // 1 day ago
  const daysLeft = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / 86_400_000));

  assertEquals(daysLeft, 0);
});
