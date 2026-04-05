/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

const VALID_LOCALES = ['en', 'es'];

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const locale = body?.locale;

  if (!locale || !VALID_LOCALES.includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) {
    // Not logged in — silently ignore (guest browsing locale change)
    return NextResponse.json({ ok: true });
  }

  const service = createServiceRoleClient();
  await service
    .from('members')
    .update({ locale })
    .eq('auth_user_id', user.id);

  return NextResponse.json({ ok: true });
}
