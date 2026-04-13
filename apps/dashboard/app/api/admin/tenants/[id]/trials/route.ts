import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

type FeatureName = 'gamification' | 'heatmap';

// POST /api/admin/tenants/[id]/trials
// Body: { feature: 'gamification' | 'heatmap' }
// Activates a 45-day feature trial for a tenant. One per feature per tenant.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthedUser();

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { feature } = await request.json() as { feature: FeatureName };

  if (!['gamification', 'heatmap'].includes(feature)) {
    return NextResponse.json({ error: 'Invalid feature' }, { status: 400 });
  }

  const service = createServiceRoleClient();

  const { data, error } = await service
    .from('feature_trials')
    .insert({
      tenant_id:    params.id,
      feature_name: feature,
      trial_start:  new Date().toISOString(),
      activated_by: user.id,
    })
    .select('id, feature_name, trial_start, trial_end, status')
    .single();

  if (error) {
    // Unique constraint → trial already exists
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Trial already used for this feature' }, { status: 409 });
    }
    console.error('[admin/trials] insert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ trial: data });
}

// GET /api/admin/tenants/[id]/trials
// Returns all trials for a tenant (admin view)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthedUser();

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = createServiceRoleClient();
  const { data: trials } = await service
    .from('feature_trials')
    .select('id, feature_name, status, trial_start, trial_end, activated_by')
    .eq('tenant_id', params.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ trials: trials ?? [] });
}
