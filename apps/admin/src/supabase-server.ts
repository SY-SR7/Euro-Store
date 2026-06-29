import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type ClientOptions = Parameters<typeof createClient>[2];

const clientOptions: ClientOptions = {
  auth: { persistSession: false, autoRefreshToken: false }
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
    process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'development-service-role-key'
  );
}

/** Client بالـ anon key — بدون session (للقراءات العامة فقط) */
export function createServerSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl(), anonKey(), clientOptions);
}

/** Client بالـ service role — يتخطى RLS */
export function createAdminSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceRoleKey(), clientOptions);
}

/**
 * يقرأ sb-access-token / sb-refresh-token من الـ cookies ويضع الجلسة.
 * يُستخدم في API routes التي تحتاج التحقق من هوية المستخدم.
 * يُرجع { client, user } — إذا user = null فالمستخدم غير مُسجّل.
 */
export async function getSessionClient(): Promise<{ client: SupabaseClient; user: import('@supabase/supabase-js').User | null }> {
  const { cookies } = await import('next/headers');
  const jar = await cookies();

  const accessToken  = jar.get('sb-access-token')?.value;
  const refreshToken = jar.get('sb-refresh-token')?.value;

  const client = createClient(supabaseUrl(), anonKey(), clientOptions);

  if (accessToken && refreshToken) {
    await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).catch(() => {});
  }

  const { data: { user } } = await client.auth.getUser();
  return { client, user };
}

/**
 * للاستخدام في Admin API routes:
 * يُرجع service-role client بعد التأكد من وجود جلسة صالحة.
 * إذا لم توجد جلسة يُرجع null.
 */
export async function requireAdminClient(): Promise<SupabaseClient | null> {
  const { user } = await getSessionClient();
  if (!user) return null;
  return createAdminSupabaseClient();
}

// Aliases للتوافق مع الكود القديم
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