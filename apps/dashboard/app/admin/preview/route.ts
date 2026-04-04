import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin/guard';
import { setAdminPlanPreview, clearAdminPlanPreview } from '@/lib/admin/planPreview';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAccess();
    const { plan } = await request.json();

    const service = createServiceRoleClient();

    if (!plan) {
      clearAdminPlanPreview();

      await service.from('platform_events').insert({
        admin_id: admin.id,
        action_type: 'plan_preview_exit',
        target_type: 'plan_preview',
        target_id: null,
        metadata: {},
      });

      return NextResponse.json({ cleared: true });
    }

    setAdminPlanPreview(plan);

    await service.from('platform_events').insert({
      admin_id: admin.id,
      action_type: 'plan_preview_set',
      target_type: 'plan_preview',
      target_id: plan,
      metadata: { plan },
    });

    return NextResponse.json({ plan });
  } catch (err) {
    console.error('Preview route error:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
