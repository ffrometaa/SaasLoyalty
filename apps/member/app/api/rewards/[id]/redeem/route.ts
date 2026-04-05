import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@loyalty-os/lib/server';

// POST /api/member/rewards/[id]/redeem - Create a redemption
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rewardId } = await params;
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID required' },
        { status: 400 }
      );
    }

    // Get member and check balance
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*, tenants!inner(id, points_per_dollar)')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if (member.status === 'blocked') {
      return NextResponse.json(
        { error: 'Account is blocked' },
        { status: 400 }
      );
    }

    // Get reward
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('tenant_id', member.tenant_id)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    if (!reward.is_active) {
      return NextResponse.json(
        { error: 'This reward is no longer available' },
        { status: 400 }
      );
    }

    if (reward.max_redemptions && reward.redemption_count >= reward.max_redemptions) {
      return NextResponse.json(
        { error: 'This reward has reached its limit' },
        { status: 400 }
      );
    }

    // Check valid dates
    const now = new Date();
    if (reward.valid_from && new Date(reward.valid_from) > now) {
      return NextResponse.json(
        { error: 'This reward is not yet available' },
        { status: 400 }
      );
    }
    if (reward.valid_until && new Date(reward.valid_until) < now) {
      return NextResponse.json(
        { error: 'This reward has expired' },
        { status: 400 }
      );
    }

    // Check points balance
    if (member.points_balance < reward.points_cost) {
      return NextResponse.json(
        { 
          error: 'Not enough points',
          required: reward.points_cost,
          current: member.points_balance
        },
        { status: 400 }
      );
    }

    // Check for existing pending redemption
    const { data: existingRedemption } = await supabase
      .from('redemptions')
      .select('id')
      .eq('member_id', memberId)
      .eq('reward_id', rewardId)
      .eq('status', 'pending')
      .gt('expires_at', now.toISOString())
      .single();

    if (existingRedemption) {
      return NextResponse.json(
        { error: 'You already have a pending redemption for this reward' },
        { status: 400 }
      );
    }

    // Generate codes
    const qrCode = `RDM-${crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    const alphanumericCode = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    
    // Calculate expiration (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create redemption
    const { data: redemption, error: redemptionError } = await serviceClient
      .from('redemptions')
      .insert({
        tenant_id: member.tenant_id,
        member_id: memberId,
        reward_id: rewardId,
        points_spent: reward.points_cost,
        status: 'pending',
        qr_code: qrCode,
        alphanumeric_code: alphanumericCode,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError);
      return NextResponse.json(
        { error: 'Failed to create redemption' },
        { status: 500 }
      );
    }

    // Create transaction
    const newBalance = member.points_balance - reward.points_cost;
    await serviceClient.from('transactions').insert({
      tenant_id: member.tenant_id,
      member_id: memberId,
      type: 'redeem',
      points: -reward.points_cost,
      points_balance: newBalance,
      description: `Redeemed: ${reward.name}`,
      reference_id: redemption.id,
    });

    // Update member balance
    await serviceClient
      .from('members')
      .update({ points_balance: newBalance })
      .eq('id', memberId);

    return NextResponse.json({
      redemption: {
        id: redemption.id,
        reward_name: reward.name,
        points_spent: reward.points_cost,
        remaining_points: newBalance,
        qr_code: qrCode,
        alphanumeric_code: alphanumericCode,
        expires_at: expiresAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Redeem reward error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
