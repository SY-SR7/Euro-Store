export interface SupabasePublicEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface SupabaseServiceEnv extends SupabasePublicEnv {
  supabaseServiceRoleKey: string;
}

type EnvSource = Record<string, string | undefined>;

function readRequiredEnv(env: EnvSource, key: string): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getSupabasePublicEnv(env: EnvSource = process.env): SupabasePublicEnv {
  return {
    supabaseUrl: readRequiredEnv(env, 'NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: readRequiredEnv(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

export function getSupabaseServiceEnv(env: EnvSource = process.env): SupabaseServiceEnv {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase service role configuration is server-only.');
  }

  return {
    ...getSupabasePublicEnv(env),
    supabaseServiceRoleKey: readRequiredEnv(env, 'SUPABASE_SERVICE_ROLE_KEY'),
  };
}
