import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';
import { redirect, notFound } from 'next/navigation';
import { getCustomSegmentById } from '../../../../../../lib/campaigns/custom-segment-queries';
import SegmentBuilder from '../../../../../../components/dashboard/SegmentBuilder';
import type { Plan } from '../../../../../../lib/plans/features';

async function resolveAuthedTenant(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<{ tenantId: string; plan: Plan } | null> {
  const user = await getAuthedUser();
  if (!user) return null;

  const { data: ownerTenant } = await supabase
    .from('tenants').select('id, plan')
    .eq('auth_user_id', user.id).is('deleted_at', null).single();
  if (ownerTenant?.id) return { tenantId: ownerTenant.id, plan: ownerTenant.plan as Plan };

  const { data: staffRecord } = await supabase
    .from('tenant_users').select('tenant_id, tenants(plan)')
    .eq('auth_user_id', user.id).single();
  if (staffRecord?.tenant_id) {
    const plan = (staffRecord.tenants as { plan: string } | null)?.plan ?? 'starter';
    return { tenantId: staffRecord.tenant_id, plan: plan as Plan };
  }
  return null;
}

export default async function EditSegmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const tenant = await resolveAuthedTenant(supabase);
  if (!tenant) redirect('/login');

  const segment = await getCustomSegmentById(tenant.tenantId, id);
  if (!segment) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Edit segment</h1>
        <p className="text-sm text-gray-500 mt-1">Update the conditions for &quot;{segment.name}&quot;.</p>
      </div>
      <SegmentBuilder segment={segment} />
    </div>
  );
}
