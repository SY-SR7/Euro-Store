// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

interface RouteParams { params: { id: string }; }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = createAdminSupabaseClient();
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    const update: Record<string, unknown> = {};
    if (typeof body.sku === 'string') update.sku = body.sku.trim();
    if (typeof body.price_syp === 'number') update.price_syp = body.price_syp;
    if ('compare_price_syp' in body) update.compare_price_syp = body.compare_price_syp ?? null;
    if (typeof body.stock_quantity === 'number') update.stock_quantity = Math.max(0, Math.floor(body.stock_quantity));
    if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
    if (typeof body.weight_grams === 'number') update.weight_grams = body.weight_grams;

    if (Object.keys(update).length > 0) {
      const { error } = await admin.from('product_variants').update(update as never).eq('id', params.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update variant_attributes if provided
    if (Array.isArray(body.attribute_value_ids)) {
      await admin.from('variant_attributes').delete().eq('variant_id', params.id);
      if (body.attribute_value_ids.length > 0) {
        const attrs = (body.attribute_value_ids as string[]).map(avid => ({
          variant_id: params.id,
          attribute_value_id: avid,
        }));
        const { error: attrErr } = await admin.from('variant_attributes').insert(attrs as never);
        if (attrErr) return NextResponse.json({ error: attrErr.message }, { status: 500 });
      }
    }

    const { data, error: selErr } = await admin
      .from('product_variants')
      .select(`id, sku, price_syp, compare_price_syp, stock_quantity, is_active,
        variant_attributes(attribute_value_id, attribute_values(id, value_ar, value_en, hex_color, attribute_types(name_ar, slug)))`)
      .eq('id', params.id)
      .single();
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) { return NextResponse.json({ error: e?.message ?? 'server_error' }, { status: 500 }); }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const admin = createAdminSupabaseClient();
    await admin.from('variant_attributes').delete().eq('variant_id', params.id);
    const { error } = await admin.from('product_variants').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}