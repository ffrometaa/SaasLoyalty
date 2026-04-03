import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import { getTenantForUser } from '../../../../lib/tenant';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getTenantForUser(supabase, session.user.id);

    return NextResponse.json({
      email: session.user.email ?? '',
      businessName: result?.tenant?.business_name ?? '',
      plan: result?.tenant?.plan ?? 'starter',
      role: result?.role ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
