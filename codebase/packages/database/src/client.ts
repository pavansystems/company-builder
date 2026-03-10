import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ---------------------------------------------------------------------------
// Environment variable helpers
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnv(name: string): string {
  return process.env[name] ?? '';
}

// ---------------------------------------------------------------------------
// Server-side client (service role — full access, bypasses RLS)
// Use only in server-side contexts: API routes, agent runners, cron jobs.
// Never expose the service role key to the browser.
// ---------------------------------------------------------------------------

export function createServerSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Browser-side client (anon key — subject to RLS policies)
// Use in React components and client-side code.
// ---------------------------------------------------------------------------

let browserClientSingleton: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  if (browserClientSingleton !== null) {
    return browserClientSingleton;
  }

  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
    );
  }

  browserClientSingleton = createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClientSingleton;
}

// ---------------------------------------------------------------------------
// Type re-export for consumers that only import from client
// ---------------------------------------------------------------------------

export type { Database } from './types';
export type { SupabaseClient };
