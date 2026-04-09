import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { NextResponse } from 'next/server';
import { evaluateCustomSegment } from '../../../../../../lib/campaigns/segments';

async function resolveAuthedTenantId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<string | null> {
  const { data: { session } } = await (supabase.auth as { getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }> }).getSession();
  if (!session?.user) return null;

  const { data: ownerTenant } = await supabase
    .from('tenants').select('id')
    .eq('auth_user_id', session.user.id).is('deleted_at', null).single();
  if (ownerTenant?.id) return ownerTenant.id;

  const { data: staffRecord } = await supabase
    .from('tenant_users').select('tenant_id')
    .eq('auth_user_id', session.user.id).single();
  return staffRecord?.tenant_id ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const tenantId = await resolveAuthedTenantId(supabase);
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const memberIds = await evaluateCustomSegment(tenantId, id);
    return NextResponse.json({ count: memberIds.length });
  } catch {
    return NextResponse.json({ error: 'Failed to evaluate segment' }, { status: 500 });
  }
}
