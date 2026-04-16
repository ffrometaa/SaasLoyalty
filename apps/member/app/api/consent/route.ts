import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

// GET /api/consent — returns pending documents for the current member
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Try cookie-based auth first
  const supabase = await createServerSupabaseClient();
  let user = null;

  try {
    const { data, error: getUserError } = await supabase.auth.getUser();
    if (getUserError) console.error('[consent GET] getUser error:', getUserError);
    user = data?.user ?? null;
  } catch (err) {
    console.error('[consent] cookie auth error:', err);
  }

  // Fallback: Bearer token (post-signup race condition)
  if (!user) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      // Service role required: consent lookup — cookie auth failed, falling back to Bearer token
      const service = createServiceRoleClient();
      const { data, error: getTokenUserError } = await (service.auth as unknown as { getUser(token: string): Promise<{ data: { user: { id: string } | null }; error: Error | null }> }).getUser(token);
      if (getTokenUserError) console.error('[consent GET] token getUser error:', getTokenUserError);
      user = data?.user ?? null;
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Service role required: consent data read — bypasses RLS for member-scoped data
  const service = createServiceRoleClient();

  // Get member record
  const { data: member, error: memberError } = await service
    .from('members')
    .select('id')
    .eq('auth_user_id', user.id)
    .limit(1)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ pending: [] });
  }

  // Call DB function
  const { data: pending, error } = await service.rpc('get_pending_consents', {
    p_member_id: member.id,
  });

  if (error) {
    console.error('[consent] get_pending_consents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ pending: pending ?? [] });
}

// POST /api/consent — record consent for one or more documents
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  let user = null;

  try {
    const { data, error: getUserError } = await supabase.auth.getUser();
    if (getUserError) console.error('[consent POST] getUser error:', getUserError);
    user = data?.user ?? null;
  } catch (err) {
    console.error('[consent] cookie auth error:', err);
  }

  if (!user) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      // Service role required: consent lookup — cookie auth failed, falling back to Bearer token
      const service = createServiceRoleClient();
      const { data, error: getTokenUserError } = await (service.auth as unknown as { getUser(token: string): Promise<{ data: { user: { id: string } | null }; error: Error | null }> }).getUser(token);
      if (getTokenUserError) console.error('[consent POST] token getUser error:', getTokenUserError);
      user = data?.user ?? null;
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { document_ids } = body as { document_ids?: string[] };

  if (!document_ids?.length) {
    return NextResponse.json({ error: 'document_ids required' }, { status: 400 });
  }

  // Service role required: consent upsert — bypasses RLS for member-scoped write
  const service = createServiceRoleClient();

  // Get member record
  const { data: member, error: memberError } = await service
    .from('members')
    .select('id')
    .eq('auth_user_id', user.id)
    .limit(1)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = request.headers.get('user-agent') ?? null;

  const rows = document_ids.map((document_id) => ({
    member_id: member.id,
    document_id,
    ip_address: ip,
    user_agent: ua,
  }));

  const { error } = await service.from('member_consents').upsert(rows, {
    onConflict: 'member_id,document_id',
    ignoreDuplicates: true,
  });

  if (error) {
    console.error('[consent] upsert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
