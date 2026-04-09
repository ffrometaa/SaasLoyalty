import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';
import { getTenantForUser } from '../../../../lib/tenant';

export async function GET() {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createServerSupabaseClient();

    const result = await getTenantForUser(supabase, user.id);

    return NextResponse.json({
      email: user.email ?? '',
      businessName: result?.tenant?.business_name ?? '',
      plan: result?.tenant?.plan ?? 'starter',
      role: result?.role ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
