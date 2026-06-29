// @ts-nocheck
import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { admin, userId } = ctx;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const allowed = ['section_key', 'title_ar', 'title_en', 'content', 'sort_order', 'is_active'];
  const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: before } = await admin
    .from('homepage_sections')
    .select('id, section_key, title_ar, title_en, is_active, sort_order')
    .eq('id', params.id)
    .single();

  const { data, error } = await admin
    .from('homepage_sections')
    .update(update as never)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'homepage_section_update',
    entityType: 'homepage_sections',
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
    .from('homepage_sections')
    .select('id, section_key, title_ar, title_en')
    .eq('id', params.id)
    .single();

  const { error, count } = await admin
    .from('homepage_sections')
    .delete({ count: 'exact' })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if ((count ?? 0) === 0) {
    return NextResponse.json({ error: 'Section not found or already deleted' }, { status: 404 });
  }

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'homepage_section_delete',
    entityType: 'homepage_sections',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
  });

  return NextResponse.json({ deleted: true });
}