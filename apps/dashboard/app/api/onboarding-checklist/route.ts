import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

// GET /api/onboarding-checklist
export async function GET(): Promise<NextResponse> {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('tenants')
      .select('id, plan_status, onboarding_completed_at, onboarding_dismissed_at, onboarding_reward_shared_at')
      .eq('auth_user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Count rewards and members in parallel
    const [rewardsResult, membersResult] = await Promise.all([
      supabase
        .from('rewards')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', data.id),
      supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', data.id),
    ]);

    const rewardCount = rewardsResult.count ?? 0;
    const memberCount = membersResult.count ?? 0;

    const steps = {
      profile_complete: true, // always true if they're logged in
      reward_created: rewardCount > 0,
      member_invited: memberCount > 0,
      reward_shared: !!data.onboarding_reward_shared_at,
    };

    const allDone = Object.values(steps).every(Boolean);
    const isDismissed = !!data.onboarding_dismissed_at;

    // Auto-complete: if all steps done and not yet stamped
    if (allDone && !data.onboarding_completed_at) {
      await supabase
        .from('tenants')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', data.id);
    }

    return NextResponse.json({
      steps,
      allDone,
      isDismissed,
      planStatus: data.plan_status,
    });
  } catch (err) {
    console.error('[onboarding-checklist GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/onboarding-checklist
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { action?: string };
    const { action } = body;

    if (action !== 'dismiss' && action !== 'mark_shared') {
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
      action === 'dismiss'
        ? { onboarding_dismissed_at: new Date().toISOString() }
        : { onboarding_reward_shared_at: new Date().toISOString() };

    await supabase
      .from('tenants')
      .update(updatePayload)
      .eq('id', tenant.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[onboarding-checklist PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
