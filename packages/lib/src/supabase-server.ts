import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Server client for API routes and server components
export async function createServerSupabaseClient(): Promise<ReturnType<typeof createServerClient>> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! /* Required: must be defined in all environments — validated at startup */,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! /* Required: must be defined in all environments — validated at startup */,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignore cookie errors in server components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Ignore cookie errors
          }
        },
      },
    }
  );
}

// Service role client for admin operations (use carefully — bypasses RLS)
export function createServiceRoleClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! /* Required: must be defined in all environments — validated at startup */,
    process.env.SUPABASE_SERVICE_ROLE_KEY! /* Required: must be defined in all environments — validated at startup */,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Returns the authenticated user validated against the Supabase Auth server.
 * Prefer this over getSession() in all server contexts — getSession() reads
 * from cookies without server-side validation and can accept stale tokens.
 */
export async function getAuthedUser(): Promise<{ id: string; email?: string } | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
