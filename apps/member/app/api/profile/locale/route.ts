import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

const VALID_LOCALES = ['en', 'es'];

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null) as { locale?: unknown } | null;
  const locale = body?.locale;

  if (!locale || typeof locale !== 'string' || !VALID_LOCALES.includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — silently ignore (guest browsing locale change)
    return NextResponse.json({ ok: true });
  }

  // Service role required: locale update — bypasses RLS for member-scoped write
  const service = createServiceRoleClient();
  const { error: updateError } = await service
    .from('members')
    .update({ locale })
    .eq('auth_user_id', user.id);

  if (updateError) {
    console.error('[locale] update error:', updateError);
    return NextResponse.json({ error: 'Failed to update locale' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
