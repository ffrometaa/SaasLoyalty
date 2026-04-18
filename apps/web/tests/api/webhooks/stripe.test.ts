import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks must be declared before imports — Vitest hoists them

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('@loyalty-os/lib/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@loyalty-os/email', () => ({
  buildWelcomeTenantEmail: vi.fn().mockReturnValue({
    enSubject: 'en-subject',
    esSubject: 'es-subject',
    enHtmlContent: 'en-content',
    esHtmlContent: 'es-content',
  }),
  buildBilingualEmail: vi.fn().mockReturnValue({ subject: 'subject', html: '<html/>' }),
  buildPaymentFailedEmail: vi.fn().mockReturnValue({
    enSubject: 'en-subject',
    esSubject: 'es-subject',
    enHtmlContent: 'en-content',
    esHtmlContent: 'es-content',
  }),
}));

vi.mock('stripe', () => {
  const mockConstructEvent = vi.fn();
  const MockStripe = vi.fn().mockImplementation(() => ({
    webhooks: { constructEvent: mockConstructEvent },
  }));
  (MockStripe as unknown as { _mockConstructEvent: Mock })._mockConstructEvent = mockConstructEvent;
  return { default: MockStripe };
});

import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { buildWelcomeTenantEmail } from '@loyalty-os/email';
import { POST } from '@/app/api/webhooks/stripe/route';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getConstructEventMock(): Mock {
  return (Stripe as unknown as { _mockConstructEvent: Mock })._mockConstructEvent;
}

/** Days from now as ISO string */
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

/**
 * Build a fake Stripe checkout.session.completed event.
 * tenantSlug and customerEmail control the metadata/customer fields.
 */
function makeCheckoutEvent(opts: {
  tenantSlug?: string;
  customerEmail?: string;
  businessName?: string;
  plan?: string;
}): Stripe.Event {
  return {
    id: 'evt_test_' + Math.random(),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test',
        object: 'checkout.session',
        customer: 'cus_test',
        subscription: 'sub_test',
        customer_email: opts.customerEmail ?? 'owner@test.com',
        customer_details: null,
        metadata: {
          tenant_slug: opts.tenantSlug ?? 'acme-coffee',
          business_name: opts.businessName ?? 'Acme Coffee',
          business_type: 'cafe',
          plan: opts.plan ?? 'starter',
        },
      } as unknown as Stripe.Checkout.Session,
    },
    object: 'event',
  } as Stripe.Event;
}

/**
 * Build a supabase mock where `.from()` returns different chains based on call order.
 * Callers pass an array of chain responses in order of .from() invocations.
 *
 * The chain is made thenable so it resolves correctly whether the caller ends with
 * `.eq()`, `.single()`, or `.insert()` — all chains eventually get awaited.
 */
function makeSupabaseMock(fromResponses: Array<Record<string, unknown>>) {
  let callIndex = 0;

  const fromMock = vi.fn().mockImplementation(() => {
    const response = fromResponses[callIndex] ?? { data: null, error: null };
    callIndex++;

    // Make the chain object itself thenable so `await chain.eq(...)` resolves to `response`
    const chain: Record<string, unknown> = {
      then: (resolve: (v: unknown) => unknown, _reject?: (e: unknown) => unknown) => resolve(response),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(response),
    };

    // Make every function on the chain return `chain` so chaining works
    (['select', 'eq', 'update', 'order', 'limit'] as const).forEach((method) => {
      (chain[method] as Mock).mockReturnValue(chain);
    });

    return chain;
  });

  return { from: fromMock };
}

function makeRequest(body = 'body'): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': 'sig_test' },
    body,
  });
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Mock next/headers to return a map with stripe-signature
  (headers as Mock).mockResolvedValue({
    get: (key: string) => (key === 'stripe-signature' ? 'sig_test' : null),
  });

  // Stub fetch so email sending doesn't fail
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

  // Stub env vars
  vi.stubEnv('RESEND_API_KEY', 'resend_test_key');
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test');
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/stripe — welcome email enrichment', () => {
  it('calls buildWelcomeTenantEmail with isFoundingPartner: true and trialDays: 60 when tenant has founding partner data', async () => {
    const event = makeCheckoutEvent({ tenantSlug: 'acme', customerEmail: 'owner@acme.com' });
    getConstructEventMock().mockReturnValueOnce(event);

    // .from() call order:
    // 0: stripe_events idempotency check → no existing event
    // 1: tenants update → success
    // 2: demo_requests select → no demo
    // 3: tenants select (founding partner) → founding partner data
    // 4: stripe_events insert → success
    const supabase = makeSupabaseMock([
      { data: null, error: { code: 'PGRST116' } },    // 0: stripe_events - no existing event
      { data: null, error: null },                       // 1: tenants update
      { data: null, error: { code: 'PGRST116' } },    // 2: demo_requests - no demo
      { data: { is_founding_partner: true, trial_ends_at: daysFromNow(60) }, error: null }, // 3: tenants select
      { data: null, error: null },                       // 4: stripe_events insert
    ]);

    (createServiceRoleClient as Mock).mockReturnValueOnce(supabase);

    await POST(makeRequest());

    expect(buildWelcomeTenantEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        isFoundingPartner: true,
        trialDays: expect.any(Number),
      })
    );

    const callArgs = (buildWelcomeTenantEmail as Mock).mock.calls[0][0];
    expect(callArgs.isFoundingPartner).toBe(true);
    // trialDays should be approximately 60 (allow 1 day variance)
    expect(callArgs.trialDays).toBeGreaterThanOrEqual(59);
    expect(callArgs.trialDays).toBeLessThanOrEqual(61);
  });

  it('calls buildWelcomeTenantEmail with isFoundingPartner: false and trialDays: 14 for standard tenant', async () => {
    const event = makeCheckoutEvent({ tenantSlug: 'acme', customerEmail: 'owner@acme.com' });
    getConstructEventMock().mockReturnValueOnce(event);

    const supabase = makeSupabaseMock([
      { data: null, error: { code: 'PGRST116' } },
      { data: null, error: null },
      { data: null, error: { code: 'PGRST116' } },
      { data: { is_founding_partner: false, trial_ends_at: daysFromNow(14) }, error: null },
      { data: null, error: null },
    ]);

    (createServiceRoleClient as Mock).mockReturnValueOnce(supabase);

    await POST(makeRequest());

    const callArgs = (buildWelcomeTenantEmail as Mock).mock.calls[0][0];
    expect(callArgs.isFoundingPartner).toBe(false);
    expect(callArgs.trialDays).toBeGreaterThanOrEqual(13);
    expect(callArgs.trialDays).toBeLessThanOrEqual(15);
  });

  it('calls buildWelcomeTenantEmail with defaults when tenant query returns an error (graceful degradation)', async () => {
    const event = makeCheckoutEvent({ tenantSlug: 'acme', customerEmail: 'owner@acme.com' });
    getConstructEventMock().mockReturnValueOnce(event);

    const supabase = makeSupabaseMock([
      { data: null, error: { code: 'PGRST116' } },
      { data: null, error: null },
      { data: null, error: { code: 'PGRST116' } },
      { data: null, error: { message: 'DB error', code: '500' } }, // tenant query fails
      { data: null, error: null },
    ]);

    (createServiceRoleClient as Mock).mockReturnValueOnce(supabase);

    await POST(makeRequest());

    const callArgs = (buildWelcomeTenantEmail as Mock).mock.calls[0][0];
    expect(callArgs.trialDays).toBe(14);
    expect(callArgs.isFoundingPartner).toBe(false);
  });

  it('does NOT call buildWelcomeTenantEmail when customerEmail is empty', async () => {
    const event = makeCheckoutEvent({ tenantSlug: 'acme', customerEmail: '' });
    // Override customer_email to empty string
    (event.data.object as Record<string, unknown>).customer_email = '';
    getConstructEventMock().mockReturnValueOnce(event);

    const supabase = makeSupabaseMock([
      { data: null, error: { code: 'PGRST116' } },
      { data: null, error: null },
      { data: null, error: null },
    ]);

    (createServiceRoleClient as Mock).mockReturnValueOnce(supabase);

    await POST(makeRequest());

    expect(buildWelcomeTenantEmail).not.toHaveBeenCalled();
  });
});
