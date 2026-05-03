// Lightweight Supabase client wrapper
// NOTE: Ensure you set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const missingEnvError = new Error('Supabase not configured: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

function createMissingSupabaseClient() {
  const brokenQuery: any = {
    select: () => brokenQuery,
    eq: () => brokenQuery,
    limit: () => brokenQuery,
    order: () => brokenQuery,
    single: async () => ({ data: null, error: missingEnvError }),
    maybeSingle: async () => ({ data: null, error: missingEnvError }),
    singleOrThrow: async () => ({ data: null, error: missingEnvError }),
    range: () => brokenQuery,
    update: () => brokenQuery,
    insert: () => brokenQuery,
    delete: () => brokenQuery,
    rpc: () => brokenQuery,
    filter: () => brokenQuery,
    match: () => brokenQuery,
    contains: () => brokenQuery,
    not: () => brokenQuery,
    is: () => brokenQuery,
  };

  return {
    from: () => brokenQuery,
    auth: {
      signInWithPassword: async () => ({ data: null, error: missingEnvError }),
      signOut: async () => ({ data: null, error: missingEnvError }),
      signUp: async () => ({ data: null, error: missingEnvError }),
      signInWithOAuth: async () => ({ data: null, error: missingEnvError }),
      onAuthStateChange: () => ({ data: null }),
      getUser: async () => ({ data: null, error: missingEnvError }),
      getSession: async () => ({ data: null, error: missingEnvError }),
    },
    rpc: async () => ({ data: null, error: missingEnvError }),
  };
}

let _supabase: any;

if (supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase environment variables are not set: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  _supabase = createMissingSupabaseClient();
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
export const supabase = _supabase;
export default supabase;
