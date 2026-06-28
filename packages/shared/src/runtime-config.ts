import { z } from 'zod';
import { readRequiredEnv } from './env';

export const deploymentProviderSchema = z.enum([
  'vercel',
  'hostinger',
  'cloudflare_pages',
  'node_server',
  'other',
]);

export const databaseProviderSchema = z.enum(['supabase', 'postgres', 'hostinger_postgres']);
export const authProviderSchema = z.enum(['supabase', 'authjs', 'custom_jwt']);
export const storageProviderSchema = z.enum(['supabase', 's3', 'cloudflare_r2', 'hostinger', 'local_private']);
export const emailProviderSchema = z.enum(['resend', 'smtp', 'hostinger_email', 'none']);
export const paymentProviderSchema = z.enum(['sham_cash', 'cash_on_delivery_only', 'none']);

const appUrlSchema = z.string().url();

export interface PublicRuntimeConfig {
  deploymentProvider: z.infer<typeof deploymentProviderSchema>;
  appUrls: {
    customer: string;
    admin: string;
    helper: string;
    partner: string;
  };
}

export interface ServerRuntimeConfig extends PublicRuntimeConfig {
  providers: {
    database: z.infer<typeof databaseProviderSchema>;
    auth: z.infer<typeof authProviderSchema>;
    storage: z.infer<typeof storageProviderSchema>;
    email: z.infer<typeof emailProviderSchema>;
    payment: z.infer<typeof paymentProviderSchema>;
  };
}

type EnvSource = Record<string, string | undefined>;

function parseProvider<T extends z.ZodEnum<[string, ...string[]]>>(schema: T, key: string, env: EnvSource): z.infer<T> {
  return schema.parse(readRequiredEnv(key, env));
}

function parsePublicProvider<T extends z.ZodEnum<[string, ...string[]]>>(
  schema: T,
  serverKey: string,
  nextPublicKey: string,
  expoPublicKey: string,
  env: EnvSource
): z.infer<T> {
  const value = env[serverKey]?.trim() ?? env[nextPublicKey]?.trim() ?? env[expoPublicKey]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${serverKey} or ${nextPublicKey} or ${expoPublicKey}`);
  }

  return schema.parse(value);
}

function readFirstRequiredUrl(env: EnvSource, keys: readonly string[]): string {
  const value = keys.map((key) => env[key]?.trim()).find((candidate) => Boolean(candidate));

  if (!value) {
    throw new Error(`Missing required environment variable: ${keys.join(' or ')}`);
  }

  return appUrlSchema.parse(value);
}

function readAppUrls(env: EnvSource): PublicRuntimeConfig['appUrls'] {
  return {
    customer: readFirstRequiredUrl(env, ['NEXT_PUBLIC_APP_URL', 'EXPO_PUBLIC_APP_URL']),
    admin: readFirstRequiredUrl(env, ['NEXT_PUBLIC_ADMIN_URL', 'EXPO_PUBLIC_ADMIN_URL']),
    helper: readFirstRequiredUrl(env, ['NEXT_PUBLIC_HELPER_URL', 'EXPO_PUBLIC_HELPER_URL']),
    partner: readFirstRequiredUrl(env, ['NEXT_PUBLIC_PARTNER_URL', 'EXPO_PUBLIC_PARTNER_URL']),
  };
}

export function getPublicRuntimeConfig(env: EnvSource = process.env): PublicRuntimeConfig {
  return {
    deploymentProvider: parsePublicProvider(
      deploymentProviderSchema,
      'EUROSTORE_DEPLOYMENT_PROVIDER',
      'NEXT_PUBLIC_EUROSTORE_DEPLOYMENT_PROVIDER',
      'EXPO_PUBLIC_EUROSTORE_DEPLOYMENT_PROVIDER',
      env
    ),
    appUrls: readAppUrls(env),
  };
}

export function getServerRuntimeConfig(env: EnvSource = process.env): ServerRuntimeConfig {
  return {
    ...getPublicRuntimeConfig(env),
    providers: {
      database: parseProvider(databaseProviderSchema, 'EUROSTORE_DATABASE_PROVIDER', env),
      auth: parseProvider(authProviderSchema, 'EUROSTORE_AUTH_PROVIDER', env),
      storage: parseProvider(storageProviderSchema, 'EUROSTORE_STORAGE_PROVIDER', env),
      email: parseProvider(emailProviderSchema, 'EUROSTORE_EMAIL_PROVIDER', env),
      payment: parseProvider(paymentProviderSchema, 'EUROSTORE_PAYMENT_PROVIDER', env),
    },
  };
}

export function buildAppUrl(app: keyof PublicRuntimeConfig['appUrls'], path = '/', env: EnvSource = process.env): string {
  const baseUrl = getPublicRuntimeConfig(env).appUrls[app];
  return new URL(path, baseUrl).toString();
}
