import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createServerSupabaseClient();

    const { document_ids } = await request.json();
    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json({ error: 'document_ids required' }, { status: 400 });
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;
    const ua = request.headers.get('user-agent') ?? null;

    const inserts = document_ids.map((document_id: string) => ({
      tenant_id: tenant.id,
      document_id,
      ip_address: ip,
      user_agent: ua,
    }));

    const { error } = await supabase
      .from('tenant_consents')
      .upsert(inserts, { onConflict: 'tenant_id,document_id' });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
