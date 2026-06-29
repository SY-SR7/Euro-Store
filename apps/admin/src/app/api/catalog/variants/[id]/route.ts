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

  const update: Record<string, unknown> = {};

  if (typeof body.sku === 'string') update.sku = body.sku.trim();
  if (typeof body.price_syp === 'number') update.price_syp = body.price_syp;
  if (typeof body.compare_price_syp === 'number' || body.compare_price_syp === null) update.compare_price_syp = body.compare_price_syp;
  if (typeof body.stock_quantity === 'number') update.stock_quantity = Math.max(0, Math.floor(body.stock_quantity));
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: before } = await admin
    .from('product_variants')
    .select('id, sku, price_syp, compare_price_syp, stock_quantity, is_active')
    .eq('id', params.id)
    .single();

  const { data, error } = await admin
    .from('product_variants')
    .update(update as never)
    .eq('id', params.id)
    .select('id, product_id, sku, price_syp, compare_price_syp, stock_quantity, is_active')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'variant_update',
    entityType: 'product_variants',
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
    .from('product_variants')
    .select('id, sku, product_id')
    .eq('id', params.id)
    .single();

  const { error, count } = await admin
    .from('product_variants')
    .delete({ count: 'exact' })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if ((count ?? 0) === 0) {
    return NextResponse.json({ error: 'Variant not found or already deleted' }, { status: 404 });
  }

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: 'admin',
    action: 'variant_delete',
    entityType: 'product_variants',
    entityId: params.id,
    beforeState: before as Record<string, unknown> | null,
  });

  return NextResponse.json({ deleted: true });
}