import 'server-only';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@eurostore/database';

type TypedSupabaseClient = SupabaseClient<Database>;
type ClientOptions = NonNullable<Parameters<typeof createClient<Database>>[2]>;

const clientOptions: ClientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    // Disable Next.js data cache so Supabase data is always fresh.
    // Without this, even force-dynamic pages may serve stale data
    // because Next.js caches individual fetch() calls independently.
    fetch: (url, options) =>
      fetch(url, { ...options, cache: 'no-store' }),
  },
};

function envValue(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}
function supabaseUrl(): string {
  return envValue('NEXT_PUBLIC_SUPABASE_URL', process.env.SUPABASE_URL);
}
function anonKey(): string {
  return envValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY);
}
function serviceRoleKey(): string {
  return envValue('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_KEY);
}

/** Client بالـ anon key — بدون session (للقراءات العامة فقط، لا يعرف من هو المستخدم) */
export function createPublicSupabaseClient(): TypedSupabaseClient {
  return createClient<Database>(supabaseUrl(), anonKey(), clientOptions);
}

/** Client بالـ service role — يتخطى RLS بالكامل */
export function createAdminSupabaseClient(): TypedSupabaseClient {
  return createClient<Database>(supabaseUrl(), serviceRoleKey(), clientOptions);
}

/**
 * يقرأ كوكي الجلسة الحقيقية التي يضعها @supabase/ssr (createBrowserClient) في صفحة
 * تسجيل الدخول — اسم الكوكي بصيغة sb-<project-ref>-auth-token، وليس
 * sb-access-token / sb-refresh-token كما كان مفترضاً سابقاً (تلك الأخيرة لا يضعها
 * أي مكان في تطبيق الويب، لذلك getSessionClient كانت تُرجع user: null دائماً).
 *
 * هذا هو نفس النمط المستخدم بنجاح في middleware.ts لحماية المسارات.
 */
export async function getSessionClient(): Promise<{ client: TypedSupabaseClient; user: User | null }> {
  const { cookies, headers } = await import('next/headers');
  const requestHeaders = await headers();
  const authorization = requestHeaders.get('authorization')?.trim() ?? '';
  const bearerMatch = /^Bearer\s+([^\s]+)$/i.exec(authorization);

  if (authorization) {
    if (!bearerMatch || bearerMatch[1].length > 8192) {
      return { client: createPublicSupabaseClient(), user: null };
    }

    const accessToken = bearerMatch[1];
    const client = createClient<Database>(supabaseUrl(), anonKey(), {
      ...clientOptions,
      global: {
        ...clientOptions.global,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });
    const { data: { user }, error } = await client.auth.getUser(accessToken);
    return { client, user: error ? null : user };
  }

  const jar = await cookies();

  const client = createServerClient<Database>(supabaseUrl(), anonKey(), {
    ...clientOptions,
    cookies: {
      getAll() {
        return jar.getAll().filter((c) => !['sb-access-token', 'sb-refresh-token'].includes(c.name));
      },
      setAll() {
        // Server Components لا يمكنها تعديل الكوكيز؛ التحديث يتم عبر middleware.ts
      },
    },
  });

  const { data: { user } } = await client.auth.getUser();
  return { client, user };
}

export default createPublicSupabaseClient;
