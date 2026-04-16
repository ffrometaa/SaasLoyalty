import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@loyalty-os/lib/server';

interface AuthWithSignOut {
  signOut(): Promise<{ error: Error | null }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  await (supabase.auth as unknown as AuthWithSignOut).signOut();
  return NextResponse.redirect(new URL('/login', request.url));
}
