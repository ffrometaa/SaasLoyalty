import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await (supabase.auth as any).getSession();

  if (!session) return NextResponse.json({ trials: [] });

  // Resolve tenant
  const { data: ownerTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('auth_user_id', session.user.id)
    .is('deleted_at', null)
    .single();

  let tenantId = ownerTenant?.id;

  if (!tenantId) {
    const { data: staffRecord } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('auth_user_id', session.user.id)
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
