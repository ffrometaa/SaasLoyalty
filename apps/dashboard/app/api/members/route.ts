import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { canAddMember } from '../../../lib/plans/features';
import type { Plan } from '../../../lib/plans/features';
import { buildBilingualEmail, buildMemberInviteEmail } from '@loyalty-os/email';
import { sanitizeSortBy, sanitizeSearch, ALLOWED_MEMBER_SORT_COLUMNS, isValidEmail } from '../../../lib/validate';

const fetchMembersList = unstable_cache(
  async (
    tenantId: string,
    page: number,
    limit: number,
    search: string,
    tier: string | null,
    status: string | null,
    sortBy: string,
    sortOrder: string,
  ) => {
    const serviceClient = createServiceRoleClient();

    let query = serviceClient
      .from('members')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,member_code.ilike.%${search}%`);
    }
    if (tier) {
      query = query.eq('tier', tier);
    }
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(sortBy as any, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: members, count, error } = await query;

    if (error) throw error;

    return {
      members: members || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },
  ['members-list'],
  { revalidate: 60, tags: ['members'] },
);

// GET /api/members - List members
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: ownerTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    let tenantId: string | null = ownerTenant?.id ?? null;

    if (!tenantId) {
      const { data: staffRecord } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      tenantId = staffRecord?.tenant_id ?? null;
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = sanitizeSearch(searchParams.get('search'));
    const tier = searchParams.get('tier') ?? null;
    const status = searchParams.get('status') ?? null;
    const sortBy = sanitizeSortBy(searchParams.get('sortBy'), ALLOWED_MEMBER_SORT_COLUMNS, 'created_at');
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const data = await fetchMembersList(tenantId, page, limit, search, tier, status, sortBy, sortOrder);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Members API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/members - Create member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { name, email, phone, sendInvite } = body;

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, slug, business_name, brand_logo_url, brand_color_primary, plan, plan_status')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenantId = tenant.id;
    const tenantPlan = ((tenant.plan as string) || 'starter') as Plan;

    // Enforce plan member limit using service role to avoid RLS issues
    if (tenant.plan_status !== 'active' && tenant.plan_status !== 'trialing') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 403 });
    }

    const { count: memberCount } = await createServiceRoleClient()
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (!canAddMember(tenantPlan, memberCount ?? 0)) {
      return NextResponse.json({ error: `Member limit reached for your ${tenantPlan} plan. Please upgrade.` }, { status: 403 });
    }

    // Generate unique member code
    const memberCode = `${tenant.slug.toUpperCase()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

    // Create member — use service role to bypass RLS (app.tenant_id session var not set)
    const serviceClient = createServiceRoleClient();

    const { data: member, error } = await serviceClient
      .from('members')
      .insert({
        tenant_id: tenantId,
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
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      return NextResponse.json(
        { error: 'Failed to create member' },
        { status: 500 }
      );
    }

    // Send invitation email if requested
    if (sendInvite && email) {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY) {
        try {
          const joinUrl = `${process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? 'https://member.loyalbase.dev'}/join/${tenant.slug}`;
          const emailContent = buildMemberInviteEmail({
            memberName: name,
            businessName: tenant.business_name,
            joinUrl,
            tenantLogoUrl: tenant.brand_logo_url ?? '',
            tenantPrimaryColor: tenant.brand_color_primary ?? '',
          });
          const { subject, html } = buildBilingualEmail(emailContent);
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: `${tenant.business_name} via LoyaltyOS <noreply@loyalbase.dev>`,
              to: [email],
              subject,
              html,
            }),
          });
        } catch (emailError) {
          console.error('Failed to send invite email:', emailError);
          // Non-blocking — member was created successfully
        }
      }
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Create member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
