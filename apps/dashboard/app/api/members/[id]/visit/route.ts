import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib';

// POST /api/members/[id]/visit - Register a visit (earn points)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { amount, description } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Get member with tenant info
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select(`
        *,
        tenants (
          id,
          slug,
          points_per_dollar
        )
      `)
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
        { error: 'Cannot register visit for blocked member' },
        { status: 400 }
      );
    }

    const tenant = member.tenants;
    const pointsPerDollar = tenant?.points_per_dollar || 1;
    const pointsEarned = Math.floor(amount * pointsPerDollar);
    const newBalance = member.points_balance + pointsEarned;
    const newLifetime = member.points_lifetime + pointsEarned;
    const newVisitsTotal = member.visits_total + 1;

    // Calculate new tier
    let newTier = 'bronze';
    if (newLifetime >= 10000) newTier = 'platinum';
    else if (newLifetime >= 5000) newTier = 'gold';
    else if (newLifetime >= 1000) newTier = 'silver';

    const tierChanged = newTier !== member.tier;

    // Use a transaction-like approach with multiple operations
    // 1. Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        tenant_id: tenant?.id,
        member_id: memberId,
        type: 'earn',
        points: pointsEarned,
        balance_after: newBalance,
        description: description || `Purchase: $${amount.toFixed(2)}`,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to record transaction' },
        { status: 500 }
      );
    }

    // 2. Update member stats
    const { error: updateError } = await supabase
      .from('members')
      .update({
        points_balance: newBalance,
        points_lifetime: newLifetime,
        visits_total: newVisitsTotal,
        last_visit_at: new Date().toISOString(),
        tier: newTier,
      })
      .eq('id', memberId);

    if (updateError) {
      console.error('Error updating member:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member points' },
        { status: 500 }
      );
    }

    // 3. Create visit record for analytics
    const now = new Date();
    await supabase.from('visits').insert({
      tenant_id: tenant?.id,
      member_id: memberId,
      transaction_id: transaction.id,
      amount,
      points_earned: pointsEarned,
      day_of_week: now.getDay(),
      hour_of_day: now.getHours(),
    });

    // 4. Cancel any active reactivation sequences
    await supabase
      .from('reactivation_sequences')
      .update({
        cancelled_at: new Date().toISOString(),
        cancelled_reason: 'visited',
      })
      .eq('member_id', memberId)
      .is('completed_at', null)
      .is('cancelled_at', null);

    return NextResponse.json({
      success: true,
      transaction,
      pointsEarned,
      newBalance,
      newTier,
      tierChanged,
    });
  } catch (error) {
    console.error('Register visit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
