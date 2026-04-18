import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

// GET /api/setup-wizard
export async function GET(): Promise<NextResponse> {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('tenants')
      .select('id, setup_wizard_completed_at, setup_wizard_dismissed_at, business_name, brand_color_primary, points_per_dollar, welcome_bonus_points')
      .eq('auth_user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      completedAt: data.setup_wizard_completed_at,
      dismissedAt: data.setup_wizard_dismissed_at,
      prefill: {
        businessName: data.business_name,
        primaryColor: data.brand_color_primary,
        pointsPerDollar: data.points_per_dollar,
        welcomeBonusPoints: data.welcome_bonus_points,
      },
    });
  } catch (err) {
    console.error('[setup-wizard GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/setup-wizard
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { action?: string };
    const { action } = body;

    if (action !== 'complete' && action !== 'dismiss') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    const updatePayload =
      action === 'complete'
        ? { setup_wizard_completed_at: new Date().toISOString() }
        : { setup_wizard_dismissed_at: new Date().toISOString() };

    await supabase
      .from('tenants')
      .update(updatePayload)
      .eq('id', tenant.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[setup-wizard PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
