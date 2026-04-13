import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';
import { isValidRedemptionCode } from '../../../lib/validate';

// POST /api/redemptions/process - Process a redemption (staff scans QR)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { code } = body;

    if (!code || !isValidRedemptionCode(String(code))) {
      return NextResponse.json(
        { error: 'Redemption code is required' },
        { status: 400 }
      );
    }

    // Find redemption by QR code or alphanumeric code
    const { data: redemption, error: findError } = await supabase
      .from('redemptions')
      .select(`
        *,
        members (
          id,
          name,
          email,
          points_balance,
          tier
        ),
        rewards (
          id,
          name,
          points_required
        )
      `)
      .or(`qr_code.eq.${code},alphanumeric_code.eq.${code}`)
      .single();

    if (findError || !redemption) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 404 }
      );
    }

    // Check if already used
    if (redemption.status === 'used') {
      return NextResponse.json(
        { error: 'This reward has already been redeemed' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(redemption.expires_at) < new Date()) {
      // Mark as expired
      const serviceClient = createServiceRoleClient();
      await serviceClient
        .from('redemptions')
        .update({ status: 'expired' })
        .eq('id', redemption.id);

      return NextResponse.json(
        { error: 'This redemption has expired' },
        { status: 400 }
      );
    }

    // Process the redemption
    const serviceClient = createServiceRoleClient();
    const { error: updateError } = await serviceClient
      .from('redemptions')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
      })
      .eq('id', redemption.id);

    if (updateError) {
      console.error('Error processing redemption:', updateError);
      return NextResponse.json(
        { error: 'Failed to process redemption' },
        { status: 500 }
      );
    }

    // Get member and reward for response
    const member = redemption.members;
    const reward = redemption.rewards;

    return NextResponse.json({
      success: true,
      redemption: {
        id: redemption.id,
        status: 'used',
        used_at: new Date().toISOString(),
        points_spent: redemption.points_spent,
        member: {
          id: member?.id,
          name: member?.name,
          email: member?.email,
        },
        reward: {
          id: reward?.id,
          name: reward?.name,
        },
      },
    });
  } catch (error) {
    console.error('Process redemption error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/redemptions - List redemptions
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const since = searchParams.get('since'); // ISO date string or YYYY-MM-DD

    let query = supabase
      .from('redemptions')
      .select(`
        *,
        members (
          id,
          name,
          email
        ),
        rewards (
          id,
          name
        )
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }
    if (since) {
      query = query.gte('used_at', since);
    }

    const { data: redemptions, count, error } = await query;

    if (error) {
      console.error('Error fetching redemptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch redemptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      redemptions: redemptions || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Redemptions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
