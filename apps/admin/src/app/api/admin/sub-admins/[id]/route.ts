import { NextResponse } from 'next/server';
import type { TableUpdate } from '@/lib/database-types';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

const idSchema = z.string().uuid();
const patchSchema = z.object({
  is_active: z.boolean().optional(),
  display_name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

function mapProfile(profile: { id: string; full_name: string | null; email: string; is_active: boolean | null; created_at: string | null }) {
  return {
    user_id: profile.id,
    display_name: profile.full_name,
    email: profile.email,
    is_active: profile.is_active ?? false,
    created_at: profile.created_at ?? '',
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('sub_admins', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!idSchema.safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const { data, error } = await ctx.admin
    .from('sub_admin_profiles')
    .select('id, full_name, email, is_active, created_at')
    .eq('id', (await params).id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(mapProfile(data));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('sub_admins', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!idSchema.safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { data: before, error: loadError } = await ctx.admin
    .from('sub_admin_profiles')
    .select('id, full_name, email, is_active, created_at')
    .eq('id', (await params).id)
    .maybeSingle();
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const profileUpdate: TableUpdate<'sub_admin_profiles'> = {};
  if (parsed.data.display_name !== undefined) profileUpdate.full_name = parsed.data.display_name;
  if (parsed.data.email !== undefined) profileUpdate.email = parsed.data.email;
  if (parsed.data.is_active !== undefined) profileUpdate.is_active = parsed.data.is_active;

  const { data: updated, error: updateError } = await ctx.admin
    .from('sub_admin_profiles')
    .update(profileUpdate)
    .eq('id', (await params).id)
    .select('id, full_name, email, is_active, created_at')
    .single();
  if (updateError) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  const authUpdate: { email?: string; email_confirm?: boolean; ban_duration?: string } = {};
  if (parsed.data.email !== undefined) {
    authUpdate.email = parsed.data.email;
    authUpdate.email_confirm = true;
  }
  if (parsed.data.is_active !== undefined) {
    authUpdate.ban_duration = parsed.data.is_active ? 'none' : '876000h';
  }

  if (Object.keys(authUpdate).length > 0) {
    const { error: authError } = await ctx.admin.auth.admin.updateUserById((await params).id, authUpdate);
    if (authError) {
      await ctx.admin.from('sub_admin_profiles').update({
        full_name: before.full_name,
        email: before.email,
        is_active: before.is_active,
      }).eq('id', (await params).id);
      return NextResponse.json({ error: 'auth_update_failed' }, { status: 500 });
    }
  }

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'sub_admin.updated',
    entityType: 'sub_admin_profiles',
    entityId: (await params).id,
    beforeState: before,
    afterState: updated,
  });

  return NextResponse.json(mapProfile(updated));
}
