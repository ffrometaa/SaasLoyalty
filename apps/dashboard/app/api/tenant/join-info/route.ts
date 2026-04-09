import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function GET() {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createServerSupabaseClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('slug, business_name, brand_app_name, join_code')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      slug: tenant.slug,
      appName: tenant.brand_app_name ?? tenant.business_name,
      businessName: tenant.business_name,
      joinCode: tenant.join_code ?? null,
    });
  } catch (error) {
    console.error('Join info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
