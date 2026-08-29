import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { collectionRpcArgs, collectionSchema } from '../_schema';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('collection_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const [{ data, error }, options] = await Promise.all([
    ctx.admin.from('collections').select('*, collection_products(product_id, sort_order)').eq('id', (await params).id).maybeSingle(),
    ctx.admin.from('products').select('id, name_ar, name_en, status').neq('status', 'archived').order('name_en'),
  ]);
  if (error || options.error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ collection: data, product_options: options.data ?? [] });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('collection_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = collectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { data: before } = await ctx.admin.from('collections').select('*').eq('id', (await params).id).maybeSingle();
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { error } = await ctx.admin.rpc('admin_save_collection', collectionRpcArgs(parsed.data, (await params).id));
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'slug_conflict' : 'database_error' }, { status: error.code === '23505' ? 409 : 500 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'collection.updated', entityType: 'collections', entityId: (await params).id, beforeState: before, afterState: parsed.data });
  return NextResponse.json({ id: (await params).id });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('collection_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: before } = await ctx.admin.from('collections').select('*').eq('id', (await params).id).maybeSingle();
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { error } = await ctx.admin.from('collections').delete().eq('id', (await params).id);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'collection.deleted', entityType: 'collections', entityId: (await params).id, beforeState: before });
  return NextResponse.json({ success: true });
}
