import { createServerClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@eurostore/database';

function supabaseUrl() { return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''; }
function anonKey() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''; }
function serviceRoleKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''; }

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false }
};

export async function getSessionClient(): Promise<{ client: SupabaseClient; user: import('@supabase/supabase-js').User | null }> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  const client = createServerClient<Database>(supabaseUrl(), anonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
      }
    }
  });

  const { data: { user } } = await client.auth.getUser();
  return { client, user };
}

export function createAdminSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl(), serviceRoleKey(), clientOptions);
}

export async function requireAdminContext(): Promise<{ admin: SupabaseClient; userId: string } | null> {
  const { user } = await getSessionClient();
  if (!user) return null;
  return { admin: createAdminSupabaseClient(), userId: user.id };
}
export async function createServerSupabaseClient() {
  const { client } = await getSessionClient();
  return client;
}

export async function writeAuditLog({
  admin, action, actorId, actorRole, entityType, entityId, beforeState, afterState
}: {
  admin: SupabaseClient;
  action: string;
  actorId?: string;
  actorRole?: string;
  entityType?: string;
  entityId?: string;
  beforeState?: any;
  afterState?: any;
}) {
  try {
    await adminClient.from('audit_logs').insert({
      action,
      details,
      user_id: userId || null
    });
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}
