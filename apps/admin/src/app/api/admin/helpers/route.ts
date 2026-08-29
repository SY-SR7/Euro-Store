import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { strongPasswordSchema } from '@eurostore/shared';

const createSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(30).nullable().optional(),
  branch_name: z.string().trim().min(2).max(100),
  password: strongPasswordSchema,
}).strict();
const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(30).nullable().optional(),
  branch_name: z.string().trim().min(2).max(100).optional(),
  is_active: z.boolean().optional(),
}).strict();

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireAdminContext('helper_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await ctx.admin.from('helper_profiles').select('id, full_name, email, phone, branch_name, is_active, created_at, updated_at').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminContext('helper_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const payload = parsed.data;
  const { data: authUser, error: authError } = await ctx.admin.auth.admin.createUser({
    email: payload.email, password: payload.password, email_confirm: true, user_metadata: { role: 'helper' },
  });
  if (authError || !authUser.user) return NextResponse.json({ error: authError?.code === 'email_exists' ? 'email_exists' : 'account_create_failed' }, { status: authError?.code === 'email_exists' ? 409 : 500 });

  const { data: profile, error: profileError } = await ctx.admin.from('helper_profiles').insert({
    id: authUser.user.id, full_name: payload.full_name, email: payload.email,
    phone: payload.phone ?? null, branch_name: payload.branch_name, is_active: true,
  }).select().single();
  if (profileError || !profile) {
    await ctx.admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: 'profile_create_failed' }, { status: 500 });
  }

  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'helper.created', entityType: 'helper_profiles', entityId: profile.id, afterState: profile });
  return NextResponse.json({ helper: profile }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAdminContext('helper_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { id, ...updates } = parsed.data;
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'no_changes' }, { status: 400 });

  const { data: before, error: loadError } = await ctx.admin.from('helper_profiles').select('*').eq('id', id).maybeSingle();
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { data: profile, error } = await ctx.admin.from('helper_profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  if (typeof updates.is_active === 'boolean' && updates.is_active !== before.is_active) {
    const { error: authError } = await ctx.admin.auth.admin.updateUserById(id, { ban_duration: updates.is_active ? 'none' : '876000h' });
    if (authError) {
      await ctx.admin.from('helper_profiles').update({ is_active: before.is_active }).eq('id', id);
      return NextResponse.json({ error: 'auth_status_update_failed' }, { status: 500 });
    }
  }

  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'helper.updated', entityType: 'helper_profiles', entityId: id, beforeState: before, afterState: profile });
  return NextResponse.json({ helper: profile });
}
