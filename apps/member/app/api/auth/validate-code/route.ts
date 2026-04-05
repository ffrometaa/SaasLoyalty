import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false });
  }

  const serviceClient = createServiceRoleClient();
  const { data } = await serviceClient
    .from('tenants')
    .select('id, business_name')
    .eq('join_code', code)
    .in('plan_status', ['trialing', 'active'])
    .single();

  if (!data) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, tenantId: data.id, tenantName: data.business_name });
}
