import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

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
    const supabase = await createServerSupabaseClient();
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

    const { data: reward, error } = await supabase
      .from('rewards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reward:', error);
      return NextResponse.json(
        { error: 'Failed to update reward' },
        { status: 500 }
      );
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
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from('rewards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting reward:', error);
      return NextResponse.json(
        { error: 'Failed to delete reward' },
        { status: 500 }
      );
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
