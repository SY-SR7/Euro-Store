import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext, writeAuditLog } from '@/supabase-server';

interface RouteParams {
  params: { id: string };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('attribute_types')
    .select('id, name_ar, name_en, slug, attribute_values(id, value_ar, value_en, hex_color, sort_order)')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.name_ar === 'string') update.name_ar = body.name_ar.trim();
  if (typeof body.name_en === 'string') update.name_en = body.name_en.trim();
  if (typeof body.slug === 'string') update.slug = body.slug.trim();

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: before } = await ctx.admin
    .from('attribute_types')
    .select('id, name_ar, name_en, slug')
    .eq('id', params.id)
    .single();

  const { data, error } = await ctx.admin
    .from('attribute_types')
    .update(update)
    .eq('id', params.id)
    .select('id, name_ar, name_en, slug, attribute_values(id, value_ar, value_en, hex_color, sort_order)')
    .single();

  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: 'admin',
    action: 'attribute_type_update',
    entityType: 'attribute_types',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
    afterState: update,
  });

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { data: before } = await ctx.admin
    .from('attribute_types')
    .select('id, name_ar, name_en, slug')
    .eq('id', params.id)
    .single();

  const { error, count } = await ctx.admin
    .from('attribute_types')
    .delete({ count: 'exact' })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });
  if ((count ?? 0) === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: 'admin',
    action: 'attribute_type_delete',
    entityType: 'attribute_types',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
  });

  return NextResponse.json({ deleted: true });
}
