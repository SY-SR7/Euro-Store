import { NextResponse } from 'next/server';
import type { TableUpdate } from '@/lib/database-types';
import { z } from 'zod';
import { dispatchPendingNotifications, notifyRestockedVariant } from '@eurostore/database';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

interface RouteParams { params: Promise<{ id: string }> }

const updateSchema = z.object({
  sku: z.string().trim().min(1).max(100).optional(),
  price_syp: z.number().int().min(0).optional(),
  price_override: z.number().int().min(0).nullable().optional(),
  compare_price_syp: z.number().int().min(0).nullable().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).nullable().optional(),
  is_active: z.boolean().optional(),
  weight_grams: z.number().int().min(0).nullable().optional(),
  attribute_value_ids: z.array(z.string().uuid()).max(100).optional(),
}).strict();

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('product_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { attribute_value_ids: attributeIds, price_override: priceOverride, ...fields } = parsed.data;
  const update: TableUpdate<'product_variants'> = { ...fields };
  if (priceOverride !== undefined) update.price_override = priceOverride;

  const { data: before } = await ctx.admin.from('product_variants').select('*').eq('id', id).maybeSingle();
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (Object.keys(update).length) {
    const { error } = await ctx.admin.from('product_variants').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.code === '23505' ? 'sku_conflict' : 'database_error' }, { status: error.code === '23505' ? 409 : 500 });
  }

  if (attributeIds) {
    const { error: deleteError } = await ctx.admin.from('variant_attributes').delete().eq('variant_id', id);
    if (deleteError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    if (attributeIds.length) {
      const { error } = await ctx.admin.from('variant_attributes').insert(attributeIds.map((attributeValueId) => ({ variant_id: id, attribute_value_id: attributeValueId })));
      if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    }
  }

  const { data, error } = await ctx.admin
    .from('product_variants')
    .select('id, sku, price_syp, price_override, compare_price_syp, stock_quantity, low_stock_threshold, weight_grams, is_active, variant_attributes(attribute_value_id, attribute_values(id, value_ar, value_en, hex_color, attribute_types(id, name_ar, slug)))')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  if ((before.stock_quantity ?? 0) <= 0 && (data.stock_quantity ?? 0) > 0) {
    await notifyRestockedVariant(ctx.admin, id);
  }
  await dispatchPendingNotifications(ctx.admin, 100);
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'variant.updated', entityType: 'product_variants', entityId: id, beforeState: before, afterState: data });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('product_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data: before } = await ctx.admin.from('product_variants').select('*').eq('id', id).maybeSingle();
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { error } = await ctx.admin.from('product_variants').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'variant_in_use' }, { status: 409 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'variant.deleted', entityType: 'product_variants', entityId: id, beforeState: before });
  return NextResponse.json({ success: true });
}
