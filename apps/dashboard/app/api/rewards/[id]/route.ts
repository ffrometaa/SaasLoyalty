import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

// GET /api/rewards/[id] - Get reward details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = await createServerSupabaseClient();

    // Resolve tenantId (owner → staff fallback)
    const { data: ownerTenant, error: ownerError } = await supabase
      .from('tenants').select('id').eq('auth_user_id', user.id).is('deleted_at', null).single();
    if (ownerError) console.error('[rewards GET] tenant lookup error:', ownerError);
    let tenantId: string | null = ownerTenant?.id ?? null;
    if (!tenantId) {
      const { data: staffRecord, error: staffError } = await supabase
        .from('tenant_users').select('tenant_id').eq('auth_user_id', user.id).single();
      if (staffError) console.error('[rewards GET] staff lookup error:', staffError);
      tenantId = staffRecord?.tenant_id ?? null;
    }
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Service role required: reward fetch scoped to tenant — bypasses RLS for read
    const serviceClient = createServiceRoleClient();
    const { data: reward, error } = await serviceClient
      .from('rewards')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    return NextResponse.json({ reward });
  } catch (error) {
    console.error('Get reward error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/rewards/[id] - Update reward
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = await createServerSupabaseClient();
    const { data: ownerTenant, error: ownerError } = await supabase
      .from('tenants').select('id').eq('auth_user_id', user.id).is('deleted_at', null).single();
    if (ownerError) console.error('[rewards PATCH] tenant lookup error:', ownerError);
    let tenantId: string | null = ownerTenant?.id ?? null;
    if (!tenantId) {
      const { data: staffRecord, error: staffError } = await supabase
        .from('tenant_users').select('tenant_id').eq('auth_user_id', user.id).single();
      if (staffError) console.error('[rewards PATCH] staff lookup error:', staffError);
      tenantId = staffRecord?.tenant_id ?? null;
    }
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const body = await request.json() as Record<string, unknown>;

    // Allowed fields to update
    const allowedFields = ['name', 'description', 'points_required', 'max_redemptions', 'valid_from', 'valid_until', 'is_active'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Service role required: reward update scoped to tenant — bypasses RLS for write
    const serviceClient = createServiceRoleClient();
    const { data: reward, error } = await serviceClient
      .from('rewards')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    return NextResponse.json({ reward });
  } catch (error) {
    console.error('Update reward error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/rewards/[id] - Soft delete reward
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = await createServerSupabaseClient();
    const { data: ownerTenant, error: ownerError2 } = await supabase
      .from('tenants').select('id').eq('auth_user_id', user.id).is('deleted_at', null).single();
    if (ownerError2) console.error('[rewards DELETE] tenant lookup error:', ownerError2);
    let tenantId: string | null = ownerTenant?.id ?? null;
    if (!tenantId) {
      const { data: staffRecord, error: staffError2 } = await supabase
        .from('tenant_users').select('tenant_id').eq('auth_user_id', user.id).single();
      if (staffError2) console.error('[rewards DELETE] staff lookup error:', staffError2);
      tenantId = staffRecord?.tenant_id ?? null;
    }
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Service role required: reward soft-delete scoped to tenant — bypasses RLS for write
    const serviceClient = createServiceRoleClient();
    const { data: reward, error } = await serviceClient
      .from('rewards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete reward error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
