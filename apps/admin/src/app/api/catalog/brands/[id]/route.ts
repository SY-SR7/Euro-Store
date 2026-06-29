// @ts-nocheck
import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

interface RouteParams {
  params: { id: string };
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { admin, userId } = ctx;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const update: Record<string, unknown> = {};

  if (typeof body.name === 'string') update.name = body.name.trim();
  if (typeof body.slug === 'string') update.slug = normalizeSlug(body.slug);
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: before } = await admin
    .from('brands')
    .select('id, name, slug, is_active')
    .eq('id', params.id)
    .single();

  const { data, error } = await admin
    .from('brands')
    .update(update as never)
    .eq('id', params.id)
    .select('id, name, slug, is_active')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'brand_update',
    entityType: 'brands',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
    afterState: update,
  });

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { admin, userId } = ctx;

  const { data: before } = await admin
    .from('brands')
    .select('id, name, slug')
    .eq('id', params.id)
    .single();

  const { error, count } = await admin
    .from('brands')
    .delete({ count: 'exact' })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if ((count ?? 0) === 0) {
    return NextResponse.json({ error: 'Brand not found or already deleted' }, { status: 404 });
  }

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'brand_delete',
    entityType: 'brands',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
  });

  return NextResponse.json({ deleted: true });
}