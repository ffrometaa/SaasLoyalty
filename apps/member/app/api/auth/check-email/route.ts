import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

export type CheckEmailStatus = 'new_user' | 'existing_user_new_tenant' | 'existing_member';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const tenantId = body?.tenantId as string | undefined;

  if (!email || !tenantId) {
    return NextResponse.json({ status: 'new_user' } satisfies { status: CheckEmailStatus });
  }

  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient.rpc('check_email_registered', {
    p_email: email,
    p_tenant_id: tenantId,
  });

  if (error || !data) {
    return NextResponse.json({ status: 'new_user' } satisfies { status: CheckEmailStatus });
  }

  return NextResponse.json(data as { status: CheckEmailStatus });
}
