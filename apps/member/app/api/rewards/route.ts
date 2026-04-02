import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib';

// GET /api/member/rewards - Get rewards for member's tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get member's tenant from session/headers
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 401 }
      );
    }

    // Get active rewards for this tenant
    const { data: rewards, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('points_required', { ascending: true });

    if (error) {
      console.error('Error fetching rewards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      );
    }

    // Filter by valid dates if set
    const now = new Date();
    const activeRewards = (rewards || []).filter(reward => {
      if (reward.valid_from && new Date(reward.valid_from) > now) return false;
      if (reward.valid_until && new Date(reward.valid_until) < now) return false;
      if (reward.max_redemptions && reward.redemption_count >= reward.max_redemptions) return false;
      return true;
    });

    return NextResponse.json({ rewards: activeRewards });
  } catch (error) {
    console.error('Member rewards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
