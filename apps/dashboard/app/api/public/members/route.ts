import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { requireMemberSlot } from '../../../../lib/plans/guardFeature';
import { getPublicMembersRatelimit } from '@/lib/ratelimit';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST /api/public/members - Create member via API key (POS / external integrations)
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401, headers: CORS_HEADERS });
    }

    const publicMembersLimiter = getPublicMembersRatelimit();
    if (publicMembersLimiter) {
      const { success, limit, reset } = await publicMembersLimiter.limit(apiKey);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json({ error: 'Too many requests' }, {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        });
      }
    }

    const supabase = createServiceRoleClient();

    // Look up tenant by api_key
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug')
      .eq('api_key', apiKey)
      .is('deleted_at', null)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400, headers: CORS_HEADERS });
    }

    // Enforce plan member limit
    try {
      await requireMemberSlot(tenant.id);
    } catch (limitError: unknown) {
      const message = limitError instanceof Error ? limitError.message : 'Member limit reached';
      return NextResponse.json({ error: message }, { status: 403, headers: CORS_HEADERS });
    }

    const memberCode = `${tenant.slug.toUpperCase()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

    const { data: member, error: insertError } = await supabase
      .from('members')
      .insert({
        tenant_id: tenant.id,
        name,
        email,
        phone: phone || null,
        member_code: memberCode,
        tier: 'bronze',
        points_balance: 0,
        points_lifetime: 0,
        visits_total: 0,
        status: 'active',
      })
      .select('id, name, email, member_code, tier, points_balance')
      .single();

    if (insertError) {
      console.error('Error creating member via public API:', insertError);
      return NextResponse.json({ error: 'Failed to create member' }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ member }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    console.error('Public members API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}
