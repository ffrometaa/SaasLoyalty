import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ trials: [] });

  const supabase = await createServerSupabaseClient();

  // Resolve tenant
  const { data: ownerTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .single();

  let tenantId = ownerTenant?.id;

  if (!tenantId) {
    const { data: staffRecord } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();
    tenantId = staffRecord?.tenant_id;
  }

  if (!tenantId) return NextResponse.json({ trials: [] });

  const { data: trials } = await supabase
    .from('feature_trials')
    .select('feature_name, status, trial_start, trial_end')
    .eq('tenant_id', tenantId);

  return NextResponse.json({ trials: trials ?? [] });
}
