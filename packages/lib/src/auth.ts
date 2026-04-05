// Auth helper functions
import { getSupabaseClient } from './supabase-browser';

export interface AuthError {
  message: string;
  status?: number;
}

export async function signInWithEmail(email: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: { message: error.message } };
  }

  return { data };
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: { message: error.message } };
  }

  return { data };
}

export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, any>) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: metadata,
    },
  });

  if (error) {
    return { error: { message: error.message } };
  }

  return { data };
}

export async function signOut() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { error: { message: error.message } };
  }

  return { success: true };
}

export async function resetPassword(email: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    return { error: { message: error.message } };
  }

  return { data };
}

export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: { message: error.message } };
  }

  return { data };
}

/**
 * @deprecated Use getUser() instead. getSession() reads from local storage and
 * does not validate with the Supabase server — tokens may be expired.
 * Safe only in browser contexts where the client auto-refreshes.
 */
export async function getSession() {
  const supabase = getSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    return { session: null, error: { message: error.message } };
  }

  return { session };
}

export async function getUser() {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    return { user: null, error: { message: error.message } };
  }

  return { user };
}
