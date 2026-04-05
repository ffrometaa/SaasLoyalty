import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ exists: false });
  }

  const serviceClient = createServiceRoleClient();
  const { data } = await serviceClient.rpc('check_email_registered', { p_email: email });

  return NextResponse.json({ exists: Boolean(data) });
}
