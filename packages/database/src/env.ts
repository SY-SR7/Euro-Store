export interface SupabasePublicEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface SupabaseServiceEnv extends SupabasePublicEnv {
  supabaseServiceRoleKey: string;
}

export type DatabaseProvider = 'supabase' | 'postgres' | 'hostinger_postgres';

type EnvSource = Record<string, string | undefined>;

function readRequiredEnv(env: EnvSource, key: string): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readFirstRequiredEnv(env: EnvSource, keys: readonly string[]): string {
  const value = keys.map((key) => env[key]?.trim()).find((candidate) => Boolean(candidate));

  if (!value) {
    throw new Error(`Missing required environment variable: ${keys.join(' or ')}`);
  }

  return value;
}

function readDatabaseProvider(env: EnvSource): DatabaseProvider {
  const provider = readFirstRequiredEnv(env, [
    'EUROSTORE_DATABASE_PROVIDER',
    'NEXT_PUBLIC_EUROSTORE_DATABASE_PROVIDER',
    'EXPO_PUBLIC_EUROSTORE_DATABASE_PROVIDER',
  ]);

  if (provider !== 'supabase' && provider !== 'postgres' && provider !== 'hostinger_postgres') {
    throw new Error(`Unsupported database provider: ${provider}`);
  }

  return provider;
}

function assertSupabaseProvider(env: EnvSource): void {
  const provider = readDatabaseProvider(env);

  if (provider !== 'supabase') {
    throw new Error(
      `Database provider "${provider}" is selected. Implement it inside @eurostore/database before using Supabase client helpers.`
    );
  }
}

export function getSupabasePublicEnv(env: EnvSource = process.env): SupabasePublicEnv {
  assertSupabaseProvider(env);

  return {
    supabaseUrl: readFirstRequiredEnv(env, ['NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL']),
    supabaseAnonKey: readFirstRequiredEnv(env, ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']),
  };
}

export function getSupabaseServiceEnv(env: EnvSource = process.env): SupabaseServiceEnv {
  if (typeof (globalThis as any)['window'] !== 'undefined') {
    throw new Error('Supabase service role configuration is server-only.');
  }

  return {
    ...getSupabasePublicEnv(env),
    supabaseServiceRoleKey: readRequiredEnv(env, 'SUPABASE_SERVICE_ROLE_KEY'),
  };
}

