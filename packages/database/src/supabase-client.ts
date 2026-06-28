import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseJSClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv, getSupabaseServiceEnv } from './env';
import type { Database } from './types';

export type EurostoreSupabaseClient = SupabaseClient<Database>;

export interface SupabaseCookieAdapter {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove?: (name: string, options: CookieOptions) => void;
}

export function createSupabaseBrowserClient(
  supabaseUrl: string,
  supabaseAnonKey: string
): EurostoreSupabaseClient {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export function createSupabaseServerClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  cookies: SupabaseCookieAdapter
): EurostoreSupabaseClient {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies.get(name);
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookies.remove?.(name, options);
      },
    },
  });
}

export function createSupabaseAdminClient(
  supabaseUrl: string,
  supabaseServiceRoleKey: string
): EurostoreSupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createSupabaseAdminClient must only be used on the server.');
  }
  return createSupabaseJSClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabasePublicClient(
  supabaseUrl: string,
  supabaseAnonKey: string
): EurostoreSupabaseClient {
  return createSupabaseJSClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseBrowserClientFromEnv(): EurostoreSupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function createSupabasePublicClientFromEnv(): EurostoreSupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  return createSupabasePublicClient(supabaseUrl, supabaseAnonKey);
}

export function createSupabaseServerClientFromEnv(
  cookies: SupabaseCookieAdapter
): EurostoreSupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, cookies);
}

export function createSupabaseAdminClientFromEnv(): EurostoreSupabaseClient {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceEnv();
  return createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);
}
