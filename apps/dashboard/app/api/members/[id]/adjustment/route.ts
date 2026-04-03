import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

// POST /api/members/[id]/adjustment - Add or subtract points manually
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { type, points, reason } = body;

    if (!type || !['add', 'subtract'].includes(type)) {
      return NextResponse.json({ error: 'type must be "add" or "subtract"' }, { status: 400 });
    }
    if (!points || points <= 0) {
      return NextResponse.json({ error: 'points must be a positive number' }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, tenant_id, points_balance, status')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.status === 'blocked') {
      return NextResponse.json({ error: 'Cannot adjust points for a blocked member' }, { status: 400 });
    }

    const delta = type === 'add' ? points : -points;
    const newBalance = Math.max(0, member.points_balance + delta);

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        tenant_id: member.tenant_id,
        member_id: memberId,
        type: 'adjustment',
        points: delta,
        balance_after: newBalance,
        description: `Manual adjustment (${reason})`,
      })
      .select()
      .single();

    if (txError) {
      return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
    }

    await supabase
      .from('members')
      .update({ points_balance: newBalance })
      .eq('id', memberId);

    return NextResponse.json({ success: true, transaction, newBalance });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
