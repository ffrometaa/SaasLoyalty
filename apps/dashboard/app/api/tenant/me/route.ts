import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_name, plan')
      .eq('auth_user_id', session.user.id)
      .is('deleted_at', null)
      .single();

    return NextResponse.json({
      email: session.user.email ?? '',
      businessName: tenant?.business_name ?? '',
      plan: tenant?.plan ?? 'starter',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
