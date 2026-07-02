import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

type ClientOptions = Parameters<typeof createClient>[2];

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
  return envValue('NEXT_PUBLIC_SUPABASE_URL', process.env.SUPABASE_URL ?? 'http://localhost:54321');
}
function anonKey(): string {
  return envValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY ?? 'development-anon-key');
}
function serviceRoleKey(): string {
  return envValue(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_KEY ?? 'development-service-role-key'
  );
}

/** Client بالـ anon key — بدون session (للقراءات العامة فقط، لا يعرف من هو المستخدم) */
export function createServerSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl(), anonKey(), clientOptions);
}

/** Client بالـ service role — يتخطى RLS بالكامل */
export function createAdminSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceRoleKey(), clientOptions);
}

/**
 * يقرأ كوكي الجلسة الحقيقية التي يضعها @supabase/ssr (createBrowserClient) في صفحة
 * تسجيل الدخول — اسم الكوكي بصيغة sb-<project-ref>-auth-token، وليس
 * sb-access-token / sb-refresh-token كما كان مفترضاً سابقاً (تلك الأخيرة لا يضعها
 * أي مكان في تطبيق الويب، لذلك getSessionClient كانت تُرجع user: null دائماً).
 *
 * هذا هو نفس النمط المستخدم بنجاح في middleware.ts لحماية المسارات.
 */
export async function getSessionClient(): Promise<{ client: SupabaseClient; user: import('@supabase/supabase-js').User | null }> {
  const { cookies } = await import('next/headers');
  const jar = await cookies();

  const client = createServerClient(supabaseUrl(), anonKey(), {
    ...clientOptions,
    cookies: {
      get(name: string) {
        return jar.get(name)?.value;
      },
      set() {
        // Server Components لا يمكنها تعديل الكوكيز؛ التحديث يتم عبر middleware.ts
      },
      remove() {
        // نفس الملاحظة أعلاه
      },
    },
  });

  const { data: { user } } = await client.auth.getUser();
  return { client: client as unknown as SupabaseClient, user };
}

// Aliases (تبقى كما هي للحفاظ على التوافق مع الاستيرادات الموجودة في باقي الملفات)
export const createSupabaseServerClient = createServerSupabaseClient;
export const createSupabaseAdminClient  = createAdminSupabaseClient;
export const createServiceSupabaseClient = createAdminSupabaseClient;
export const createServiceRoleSupabaseClient = createAdminSupabaseClient;
export const getServerSupabase = createServerSupabaseClient;
export const getAdminSupabase  = createAdminSupabaseClient;
export const getSupabaseServer = createServerSupabaseClient;
export const getSupabaseAdmin  = createAdminSupabaseClient;
export const supabaseServer    = createServerSupabaseClient();
export const serverSupabase    = supabaseServer;
export const supabaseAdmin     = createAdminSupabaseClient();
export const adminSupabase     = supabaseAdmin;
export default createServerSupabaseClient;
