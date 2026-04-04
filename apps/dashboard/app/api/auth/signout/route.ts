import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  await (supabase.auth as any).signOut();
  return NextResponse.redirect(new URL('/login', request.url));
}
