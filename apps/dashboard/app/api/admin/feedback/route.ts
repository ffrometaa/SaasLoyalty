import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { verifyAdminAccess } from '@/lib/admin/guard';

const VALID_STATUSES = ['new', 'read', 'resolved'] as const;
type FeedbackStatus = typeof VALID_STATUSES[number];

function isValidBody(v: unknown): v is { id: string; status: string } {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).id === 'string' &&
    typeof (v as Record<string, unknown>).status === 'string'
  );
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    await verifyAdminAccess();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();

  if (!isValidBody(body)) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  const { id, status } = body;

  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Service role required: feedback_submissions has no SELECT/UPDATE policy for authenticated role
  const service = createServiceRoleClient();
  const { error } = await service
    .from('feedback_submissions')
    .update({ status: status as FeedbackStatus })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
