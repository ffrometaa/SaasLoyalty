import { createServerSupabaseClient } from '@loyalty-os/lib/server';

// Re-export for convenience
export { createServerSupabaseClient };

/**
 * Get the authenticated server-side user.
 * Wraps supabase.auth.getUser() with explicit typing to work around
 * @supabase/ssr 0.5.x TypeScript inference issue.
 */
export async function getServerUser() {
  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authClient = supabase.auth as any;
  const {
    data: { user },
  } = await authClient.getUser();

  return user as { id: string; email?: string } | null;
}
