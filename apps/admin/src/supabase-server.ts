import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database, Json } from '@eurostore/database';
import { ADMIN_TOTP_COOKIE_NAME, verifyTotpSessionToken } from '@eurostore/shared';

function supabaseUrl() { return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''; }
function anonKey() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''; }
function serviceRoleKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''; }

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false }
};

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getSessionClient(): Promise<{ client: TypedSupabaseClient; user: User | null }> {
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

type RequiredAction = 'view' | 'edit' | 'delete' | 'create' | 'full_access';
export type AdminPortalPermission = {
  module: string;
  permission_level: 'view_only' | 'edit' | 'full_access';
};

export type AdminPortalContext = {
  admin: TypedSupabaseClient;
  userId: string;
  role: 'admin' | 'sub_admin';
  permissions: AdminPortalPermission[];
};

async function hasVerifiedAdminTotp(userId: string) {
  const { cookies } = await import('next/headers');
  const token = (await cookies()).get(ADMIN_TOTP_COOKIE_NAME)?.value;
  const secret = process.env.EUROSTORE_AUTH_COOKIE_SECRET ?? '';

  if (!token || !secret) return false;

  const payload = await verifyTotpSessionToken(token, secret).catch(() => null);
  return payload?.userId === userId;
}

export async function getAdminPortalContext(): Promise<AdminPortalContext | null> {
  const { user } = await getSessionClient();
  if (!user) return null;
  if (!(await hasVerifiedAdminTotp(user.id))) return null;

  const admin = createAdminSupabaseClient();

  const { data: adminProfile } = await admin
    .from('admin_profiles')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (adminProfile) return { admin, userId: user.id, role: 'admin', permissions: [] };

  const { data: subAdminProfile } = await admin
    .from('sub_admin_profiles')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (subAdminProfile) {
    const { data: permissions, error } = await admin
      .from('sub_admin_permissions')
      .select('module, permission_level')
      .eq('sub_admin_id', user.id);

    if (error) return null;

    return {
      admin,
      userId: user.id,
      role: 'sub_admin',
      permissions: (permissions ?? []) as AdminPortalPermission[],
    };
  }

  return null;
}

export async function requireAdminContext(
  requiredModule?: string,
  requiredAction: RequiredAction = 'view'
): Promise<AdminPortalContext | null> {
  const context = await getAdminPortalContext();
  if (!context) return null;
  if (context.role === 'admin') return context;
  if (!requiredModule) return null;

  const permission = context.permissions.find((item) => item.module === requiredModule);
  if (!permission) return null;

  const level = permission.permission_level;
  if (['delete', 'create', 'full_access'].includes(requiredAction) && level !== 'full_access') return null;
  if (requiredAction === 'edit' && level === 'view_only') return null;

  return context;
}

export async function createServerSupabaseClient() {
  const { client } = await getSessionClient();
  return client;
}

export async function writeAuditLog({
  admin, action, actorId, actorRole, entityType, entityId, beforeState, afterState
}: {
  admin: TypedSupabaseClient;
  action: string;
  actorId?: string;
  actorRole?: string;
  entityType?: string;
  entityId?: string;
  beforeState?: unknown;
  afterState?: unknown;
}) {
  try {
    const roles = new Set<Database['public']['Enums']['user_role']>(['customer', 'admin', 'sub_admin', 'helper', 'partner', 'system']);
    const actorRoleValue = actorRole && roles.has(actorRole as Database['public']['Enums']['user_role'])
      ? actorRole as Database['public']['Enums']['user_role']
      : 'system';
    const toJson = (value: unknown): Json | null => {
      if (value === undefined) return null;
      try {
        return JSON.parse(JSON.stringify(value)) as Json;
      } catch {
        return { serialization_error: true };
      }
    };
    await admin.from('audit_logs').insert({
      action,
      entity_type: entityType ?? 'unknown',
      entity_id: entityId ?? actorId ?? '00000000-0000-0000-0000-000000000000',
      actor_id: actorId ?? '00000000-0000-0000-0000-000000000000',
      actor_role: actorRoleValue,
      before_state: toJson(beforeState),
      after_state: toJson(afterState),
    });
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}
