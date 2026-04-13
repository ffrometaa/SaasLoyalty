import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

// GET /api/rewards/[id] - Get reward details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: reward, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
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
) {
  try {
    const { id } = await params;
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = await createServerSupabaseClient();
    const { data: ownerTenant } = await supabase
      .from('tenants').select('id').eq('auth_user_id', user.id).is('deleted_at', null).single();
    let tenantId: string | null = ownerTenant?.id ?? null;
    if (!tenantId) {
      const { data: staffRecord } = await supabase
        .from('tenant_users').select('tenant_id').eq('auth_user_id', user.id).single();
      tenantId = staffRecord?.tenant_id ?? null;
    }
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const body = await request.json();

    // Allowed fields to update
    const allowedFields = ['name', 'description', 'points_required', 'max_redemptions', 'valid_from', 'valid_until', 'is_active'];
    const updates: Record<string, any> = {};

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
) {
  try {
    const { id } = await params;
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = await createServerSupabaseClient();
    const { data: ownerTenant } = await supabase
      .from('tenants').select('id').eq('auth_user_id', user.id).is('deleted_at', null).single();
    let tenantId: string | null = ownerTenant?.id ?? null;
    if (!tenantId) {
      const { data: staffRecord } = await supabase
        .from('tenant_users').select('tenant_id').eq('auth_user_id', user.id).single();
      tenantId = staffRecord?.tenant_id ?? null;
    }
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

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
