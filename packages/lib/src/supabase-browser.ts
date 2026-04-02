import { createBrowserClient } from '@supabase/ssr';

// Browser client for client-side usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for client-side
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseClient(): any {
  if (!client) {
    client = createClient();
  }
  return client;
}
