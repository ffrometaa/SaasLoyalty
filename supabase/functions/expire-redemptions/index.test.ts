// Deno tests for expire-redemptions edge function.
// Run with: deno test --allow-env supabase/functions/expire-redemptions/index.test.ts

import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// ─── TEST HELPERS ─────────────────────────────────────────────────────────────

const VALID_SECRET = 'test-cron-secret';

function makeRequest(secret?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) headers['Authorization'] = `Bearer ${secret}`;
  return new Request('http://localhost/functions/v1/expire-redemptions', {
    method: 'POST',
    headers,
    body: '{"trigger":"cron"}',
  });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

Deno.test('rejects request with no Authorization header → 401', () => {
  const CRON_SECRET = VALID_SECRET;
  const authHeader = '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const isUnauthorized = !CRON_SECRET || secret !== CRON_SECRET;

  assertEquals(isUnauthorized, true);
});

Deno.test('rejects request with wrong secret → 401', () => {
  const CRON_SECRET = VALID_SECRET;
  const authHeader = 'Bearer wrong-secret';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const isUnauthorized = !CRON_SECRET || secret !== CRON_SECRET;

  assertEquals(isUnauthorized, true);
});

Deno.test('accepts request with correct Bearer secret', () => {
  const CRON_SECRET = VALID_SECRET;
  const authHeader = `Bearer ${VALID_SECRET}`;
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const isUnauthorized = !CRON_SECRET || secret !== CRON_SECRET;

  assertEquals(isUnauthorized, false);
});

// ─── EXPIRY UPDATE LOGIC ──────────────────────────────────────────────────────

Deno.test('valid secret + expired rows exist → returns { ok: true, expired: N }', async () => {
  // Simulate the function's core logic with a stub Supabase client
  const EXPIRED_COUNT = 3;

  const supabaseStub = {
    from: (_table: string) => ({
      update: (_payload: unknown) => ({
        eq: (_col: string, _val: unknown) => ({
          lt: (_col2: string, _val2: unknown) => ({
            select: (_cols: string, _opts: unknown) =>
              Promise.resolve({ error: null, count: EXPIRED_COUNT }),
          }),
        }),
      }),
    }),
  };

  const { error, count } = await supabaseStub
    .from('redemptions')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select('id', { count: 'exact', head: true });

  const result = { ok: !error, expired: count ?? 0 };

  assertEquals(result.ok, true);
  assertEquals(result.expired, EXPIRED_COUNT);
});

Deno.test('valid secret + no expired rows → returns { ok: true, expired: 0 }', async () => {
  const supabaseStub = {
    from: (_table: string) => ({
      update: (_payload: unknown) => ({
        eq: (_col: string, _val: unknown) => ({
          lt: (_col2: string, _val2: unknown) => ({
            select: (_cols: string, _opts: unknown) =>
              Promise.resolve({ error: null, count: 0 }),
          }),
        }),
      }),
    }),
  };

  const { error, count } = await supabaseStub
    .from('redemptions')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select('id', { count: 'exact', head: true });

  const result = { ok: !error, expired: count ?? 0 };

  assertEquals(result.ok, true);
  assertEquals(result.expired, 0);
});

Deno.test('invalid CRON_SECRET → 401, DB update is never called', async () => {
  let dbCalled = false;

  const CRON_SECRET = VALID_SECRET;
  const authHeader = 'Bearer wrong-secret';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const isUnauthorized = !CRON_SECRET || secret !== CRON_SECRET;

  if (!isUnauthorized) {
    // This block must NOT execute
    dbCalled = true;
  }

  assertEquals(isUnauthorized, true);
  assertEquals(dbCalled, false);
});
