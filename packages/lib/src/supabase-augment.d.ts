import type { UserResponse } from '@supabase/auth-js';

declare module '@supabase/supabase-js' {
  interface SupabaseAuthClient {
    getUser(jwt?: string): Promise<UserResponse>;
  }
}
