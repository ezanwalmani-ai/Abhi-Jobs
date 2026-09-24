import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase project configurations
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ruagizqernsqypujeutu.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_rri7Egy75DKgLgQ2W8kiWA_iwyeHLeC';

// Initialize Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SupabaseHealthStatus {
  connected: boolean;
  url: string;
  authHealthy: boolean;
  message: string;
  tablesAvailable: {
    users: boolean;
    jobs: boolean;
    applications: boolean;
    candidates: boolean;
    employers: boolean;
  };
}

/**
 * Checks connection health and introspects available tables
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthStatus> {
  const status: SupabaseHealthStatus = {
    connected: false,
    url: SUPABASE_URL,
    authHealthy: false,
    message: '',
    tablesAvailable: {
      users: false,
      jobs: false,
      applications: false,
      candidates: false,
      employers: false,
    },
  };

  try {
    // 1. Check Auth session connectivity
    const { error: authError } = await supabase.auth.getSession();
    if (!authError) {
      status.authHealthy = true;
      status.connected = true;
    }

    // 2. Test table availability
    const [usersRes, jobsRes, appsRes] = await Promise.allSettled([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
    ]);

    if (usersRes.status === 'fulfilled' && !usersRes.value.error) {
      status.tablesAvailable.users = true;
    }
    if (jobsRes.status === 'fulfilled' && !jobsRes.value.error) {
      status.tablesAvailable.jobs = true;
    }
    if (appsRes.status === 'fulfilled' && !appsRes.value.error) {
      status.tablesAvailable.applications = true;
    }

    status.message = status.connected
      ? 'Successfully connected to Supabase (' + SUPABASE_URL + ')'
      : 'Could not establish connection to Supabase';

    return status;
  } catch (err: any) {
    status.connected = false;
    status.message = err?.message || 'Error communicating with Supabase';
    return status;
  }
}
