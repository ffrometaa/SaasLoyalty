import { NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@loyalty-os/lib/server';
import { cookies } from 'next/headers';
import { getGoogleReviewRatelimit } from '@/lib/ratelimit';

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const reviewLimiter = getGoogleReviewRatelimit();
    if (reviewLimiter) {
      const { success, limit, reset } = await reviewLimiter.limit(user.id);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json({ error: 'Too many requests' }, {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        });
      }
    }

    const tenantId = (await cookies()).get('loyalty_tenant_id')?.value;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

    // Service role required: points transaction + member update — bypasses RLS
    const service = createServiceRoleClient();

    // Load member and tenant config
    const [memberResult, tenantResult] = await Promise.all([
      service.from('members')
        .select('id, points_balance, points_lifetime, google_review_claimed_at')
        .eq('auth_user_id', user.id)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .single(),
      service.from('tenants')
        .select('google_review_bonus_enabled, google_review_bonus_points, google_review_url')
        .eq('id', tenantId)
        .single(),
    ]);
    if (memberResult.error) console.error('[google-review-claim] member query error:', memberResult.error);
    if (tenantResult.error) console.error('[google-review-claim] tenant query error:', tenantResult.error);
    const member = memberResult.data;
    const tenant = tenantResult.data;

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (!tenant?.google_review_bonus_enabled) return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    if (member.google_review_claimed_at) return NextResponse.json({ error: 'Already claimed' }, { status: 409 });

    const bonus = tenant.google_review_bonus_points ?? 100;
    const newBalance = member.points_balance + bonus;
    const newLifetime = member.points_lifetime + bonus;

    const [txResult, memberUpdateResult] = await Promise.all([
      service.from('transactions').insert({
        tenant_id: tenantId,
        member_id: member.id,
        type: 'bonus',
        points: bonus,
        balance_after: newBalance,
        description: 'Google Review bonus',
      }),
      service.from('members').update({
        points_balance: newBalance,
        points_lifetime: newLifetime,
        google_review_claimed_at: new Date().toISOString(),
      }).eq('id', member.id),
    ]);

    if (txResult.error || memberUpdateResult.error) {
      console.error('[google-review-claim] write error:', txResult.error ?? memberUpdateResult.error);
      return NextResponse.json({ error: 'Failed to record reward' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pointsAwarded: bonus, newBalance });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
