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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;

  const { data, error } = await admin
    .from('products')
    .select('id,name_ar,name_en,slug,description_ar,description_en,category_id,brand_id,is_featured,is_active')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin, userId } = ctx;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const update: Record<string, unknown> = {};

  if (typeof body.name_ar === 'string') update.name_ar = body.name_ar.trim();
  if (typeof body.name_en === 'string') update.name_en = body.name_en.trim();
  if (typeof body.slug === 'string') update.slug = normalizeSlug(body.slug);
  if (typeof body.description_ar === 'string') update.description_ar = body.description_ar;
  if (typeof body.description_en === 'string') update.description_en = body.description_en;
  if (typeof body.category_id === 'string' || body.category_id === null) update.category_id = body.category_id || null;
  if (typeof body.brand_id === 'string' || body.brand_id === null) update.brand_id = body.brand_id || null;
  if (typeof body.is_featured === 'boolean') update.is_featured = body.is_featured;
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: before } = await admin
    .from('products')
    .select('id,name_ar,name_en,slug,is_featured,is_active,category_id,brand_id')
    .eq('id', params.id)
    .single();

  const { data, error } = await admin
    .from('products')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'product_update',
    entityType: 'products',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
    afterState: update,
  });

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin, userId } = ctx;

  const { data: before } = await admin
    .from('products')
    .select('id, name_ar, name_en, slug')
    .eq('id', params.id)
    .single();

  const { error, count } = await admin
    .from('products')
    .delete({ count: 'exact' })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error?.message || 'database_error' }, { status: 500 });

  if ((count ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found or already deleted' }, { status: 404 });
  }

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'product_delete',
    entityType: 'products',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
  });

  return NextResponse.json({ deleted: true });
}
