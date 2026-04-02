import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib';

// GET /api/member/redemptions - Get member's redemptions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Get member ID from header
    const memberId = request.headers.get('x-member-id');
    
    if (!memberId) {
      return NextResponse.json(
        { error: 'Member context required' },
        { status: 401 }
      );
    }

    let query = supabase
      .from('redemptions')
      .select(`
        *,
        rewards (
          name,
          description
        )
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: redemptions, error } = await query;

    if (error) {
      console.error('Error fetching redemptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch redemptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ redemptions: redemptions || [] });
  } catch (error) {
    console.error('Member redemptions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
