import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthedUser } from '@loyalty-os/lib/server';

// GET /api/redemptions/verify?code=X
// Preview a redemption code WITHOUT marking it as used.
// Returns member + reward info so staff can verify validity before processing.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const code = request.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    const { data: redemption, error } = await supabase
      .from('redemptions')
      .select(`
        id, status, points_spent, expires_at, created_at,
        members ( id, name, email, tier, points_balance ),
        rewards ( id, name )
      `)
      .or(`qr_code.eq.${code},alphanumeric_code.eq.${code}`)
      .single();

    if (error || !redemption) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
    }

    if (redemption.status === 'used') {
      return NextResponse.json({ error: 'This reward has already been redeemed' }, { status: 400 });
    }

    if (new Date(redemption.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This redemption has expired' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      redemption: {
        id: redemption.id,
        status: redemption.status,
        points_spent: redemption.points_spent,
        expires_at: redemption.expires_at,
        member: redemption.members,
        reward: redemption.rewards,
      },
    });
  } catch (err) {
    console.error('Verify redemption error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
