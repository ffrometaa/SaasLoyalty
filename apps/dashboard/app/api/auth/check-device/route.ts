import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  try {
    const { device_id } = await request.json();
    if (!device_id) {
      return NextResponse.json({ trusted: false });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceRoleClient();
    const { data } = await service
      .from('trusted_devices')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .eq('device_id', device_id)
      .single();

    if (data) {
      // Update last_seen_at
      await service
        .from('trusted_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', data.id);
    }

    return NextResponse.json({ trusted: !!data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
