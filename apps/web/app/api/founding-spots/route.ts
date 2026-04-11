import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { FOUNDING_PARTNER_MAX_SPOTS } from '@loyalty-os/config';

export async function GET() {
  const supabase = createServiceRoleClient();

  const { count, error } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('is_founding_partner', true);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch spots' }, { status: 500 });
  }

  const taken = count ?? 0;
  const remaining = Math.max(0, FOUNDING_PARTNER_MAX_SPOTS - taken);

  return NextResponse.json({ remaining, total: FOUNDING_PARTNER_MAX_SPOTS, taken });
}
