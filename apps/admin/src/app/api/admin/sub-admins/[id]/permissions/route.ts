import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

const permissionSchema = z.object({
  permissions: z.array(z.object({
    module: z.string().min(1).max(80),
    permission_level: z.enum(['view_only', 'edit', 'full_access']),
  })).default([]),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdminContext('sub_admins', 'edit');
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.role !== 'admin') {
    return NextResponse.json({ error: 'Only main admin can edit permissions' }, { status: 403 });
  }

  const parsed = permissionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_permissions' }, { status: 400 });
  }

  const subAdminId = (await params).id;
  const { data: before } = await ctx.admin.from('sub_admin_permissions')
    .select('module, permission_level').eq('sub_admin_id', subAdminId);
  const { data, error } = await ctx.admin.rpc('replace_sub_admin_permissions', {
    p_sub_admin_id: subAdminId,
    p_permissions: parsed.data.permissions,
    p_granted_by: ctx.userId,
  });
  if (error) return NextResponse.json({ error: 'permissions_update_failed' }, { status: 400 });

  await writeAuditLog({
    admin: ctx.admin,
    action: 'sub_admin.permissions.updated',
    actorId: ctx.userId,
    actorRole: ctx.role,
    entityType: 'sub_admin_permissions',
    entityId: subAdminId,
    beforeState: { permissions: before ?? [] },
    afterState: { permissions: data ?? [] },
  });

  return NextResponse.json({ success: true, permissions: data ?? [] });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdminContext('sub_admins', 'view');
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await ctx.admin
    .from('sub_admin_permissions')
    .select('module, permission_level')
    .eq('sub_admin_id', (await params).id);

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 400 });
  return NextResponse.json(data ?? []);
}
