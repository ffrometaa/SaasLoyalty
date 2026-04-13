import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createServerSupabaseClient();

    const { data: ownerTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .is('deleted_at', null)
      .single();

    let tenantId: string | null = ownerTenant?.id ?? null;

    if (!tenantId) {
      const { data: staffRecord } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      tenantId = staffRecord?.tenant_id ?? null;
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const serviceClient = createServiceRoleClient();

    // Fetch member with transactions and redemptions
    const { data: member, error } = await serviceClient
      .from('members')
      .select(`
        *,
        transactions (
          id,
          type,
          points,
          points_balance,
          description,
          created_at
        ),
        redemptions (
          id,
          reward_id,
          rewards:reward_id (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !member) {
      console.error('Error fetching member:', error);
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Calculate top 3 products acquired (from redemptions)
    const redemptions = member.redemptions || [];
    const rewardCounts: Record<string, { name: string; count: number }> = {};
    for (const r of redemptions as any[]) {
      if (r.rewards && r.rewards.name) {
        if (!rewardCounts[r.reward_id]) {
          rewardCounts[r.reward_id] = { name: r.rewards.name, count: 0 };
        }
        rewardCounts[r.reward_id].count++;
      }
    }

    const topRewards = Object.values(rewardCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(r => ({ name: r.name, count: r.count }));

    // Omit raw redemptions to save bandwidth
    delete member.redemptions;
    (member as any).top_rewards = topRewards;

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Get member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/members/[id] - Update member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    const allowedFields = ['name', 'email', 'phone', 'birthday', 'accepts_email', 'accepts_push', 'status'];
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
    const { data: member, error } = await serviceClient
      .from('members')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
