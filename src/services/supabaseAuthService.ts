/**
 * ABHI JOBS — Shared Frontend Supabase Auth & RBAC Utilities (Phase 2B Prepared)
 *
 * Security guarantees:
 * - Uses ONLY the public Supabase client (VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY).
 * - Never references or embeds SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.
 * - Never allows client-side self-assignment of administrator roles.
 * - Admin checks here are strictly for UI routing/gating; all data access and mutations
 *   are enforced server-side by PostgreSQL RLS and Supabase Edge Functions.
 */

import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const PRIVATE_ADMIN_ROUTE = '/abhi-control-center';

export type AdminRoleName =
  | 'super_admin'
  | 'job_admin'
  | 'recruitment_admin'
  | 'learning_admin'
  | 'content_admin'
  | 'read_only_admin';

export interface SupabaseAdminRoleRecord {
  userId: string;
  role: AdminRoleName;
  isActive: boolean;
}

export async function getSupabaseSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session ?? null;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const session = await getSupabaseSession();
  return session?.access_token ?? null;
}

export async function getSupabaseCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function signUpWithSupabaseEmail(params: {
  email: string;
  password: string;
  fullName: string;
  accountType: 'job_seeker' | 'employer';
}) {
  // Strictly restrict self-signup account types to job_seeker or employer
  const safeRole = params.accountType === 'employer' ? 'employer' : 'job_seeker';
  return supabase.auth.signUp({
    email: params.email.trim().toLowerCase(),
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        role: safeRole,
      },
    },
  });
}

export async function signInWithSupabaseEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signInWithSupabaseGoogle(redirectPath = '/dashboard') {
  const safePath = redirectPath.startsWith('/') ? redirectPath : '/dashboard';
  const redirectTo = `${window.location.origin}${safePath}`;
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

export async function requestSupabasePasswordReset(email: string) {
  const redirectTo = `${window.location.origin}/login`;
  return supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });
}

export async function signOutSupabase() {
  return supabase.auth.signOut();
}

/**
 * Checks whether the currently signed-in, email-verified Supabase user holds
 * an active role in `public.admin_roles` (enforced by RLS `user_id = auth.uid()`).
 */
export async function fetchCurrentSupabaseAdminRole(): Promise<SupabaseAdminRoleRecord | null> {
  const user = await getSupabaseCurrentUser();
  if (!user || !user.email_confirmed_at) {
    return null;
  }

  const { data, error } = await supabase
    .from('admin_roles')
    .select('user_id, role, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    userId: data.user_id,
    role: data.role as AdminRoleName,
    isActive: Boolean(data.is_active),
  };
}
