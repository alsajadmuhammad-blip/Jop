// Lightweight Supabase client wrapper
// NOTE: Ensure you set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const missingEnvError = new Error('Supabase not configured: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, '=');

  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(
      Array.from(window.atob(padded), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  return '';
}

function parseSupabaseAnonKeyPayload(key: string): Record<string, unknown> | null {
  const segments = key.split('.');
  if (segments.length < 2) return null;

  try {
    return JSON.parse(base64UrlDecode(segments[1]));
  } catch {
    return null;
  }
}

function getSupabaseProjectRefFromUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    const match = hostname.match(/^([^.]+)\.supabase\.co$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function hasMatchingSupabaseAnonKey(url: string, key: string) {
  const ref = getSupabaseProjectRefFromUrl(url);
  if (!ref) return false;

  const payload = parseSupabaseAnonKeyPayload(key);
  if (!payload || typeof payload !== 'object') return false;

  const role = payload.role ?? payload.rol;
  const keyRef = payload.ref ?? payload.sub ?? payload.project_id;
  return keyRef === ref && role === 'anon';
}

type BrokenSupabaseQuery = {
  select: () => BrokenSupabaseQuery;
  eq: () => BrokenSupabaseQuery;
  limit: () => BrokenSupabaseQuery;
  order: () => BrokenSupabaseQuery;
  single: () => Promise<{ data: null; error: Error }>;
  maybeSingle: () => Promise<{ data: null; error: Error }>;
  singleOrThrow: () => Promise<{ data: null; error: Error }>;
  range: () => BrokenSupabaseQuery;
  update: () => BrokenSupabaseQuery;
  insert: () => BrokenSupabaseQuery;
  delete: () => BrokenSupabaseQuery;
  rpc: () => BrokenSupabaseQuery;
  filter: () => BrokenSupabaseQuery;
  match: () => BrokenSupabaseQuery;
  contains: () => BrokenSupabaseQuery;
  not: () => BrokenSupabaseQuery;
  is: () => BrokenSupabaseQuery;
};

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
  } as any;
}

let _supabase: any;
let supabaseConfigError: Error | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  _supabase = createMissingSupabaseClient();
  supabaseConfigError = missingEnvError;
} else if (!hasMatchingSupabaseAnonKey(supabaseUrl, supabaseAnonKey)) {
  supabaseConfigError = new Error('Supabase anon key is present but does not match the configured project URL. Please update NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.');
  console.error(supabaseConfigError.message);
  _supabase = createMissingSupabaseClient();
} else {
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseConfigError);
export const supabaseConfigErrorMessage = supabaseConfigError?.message || null;
export const supabase = _supabase;
export default supabase;
