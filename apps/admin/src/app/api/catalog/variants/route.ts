import { requireAdminContext } from '@/supabase-server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const schema = z.object({
  product_id:        z.string().uuid(),
  sku:               z.string().min(1),
  price_syp:         z.number().nonnegative(),
  compare_price_syp: z.number().nonnegative().nullable().optional(),
  stock_quantity:    z.number().int().nonnegative().default(0),
  weight_grams:      z.number().int().nonnegative().nullable().optional(),
  is_active:         z.boolean().default(true),
  attribute_value_ids: z.array(z.string().uuid()).optional(),
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const product_id = searchParams.get('product_id') ?? '';
  const admin = createAdminSupabaseClient();
  let query = admin
    .from('product_variants')
    .select(`
      id, product_id, sku, price_syp, compare_price_syp, stock_quantity, is_active, weight_grams,
      variant_attributes(
        attribute_value_id,
        attribute_values(id, value_ar, value_en, hex_color, sort_order,
          attribute_types(id, name_ar, name_en, slug)
        )
      )
    `)
    .order('price_syp');
  if (product_id) query = query.eq('product_id', product_id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    const admin = createAdminSupabaseClient();
    const { attribute_value_ids, ...variantData } = parsed.data;
    const { data: newVariant, error } = await admin
      .from('product_variants')
      .insert(variantData as never)
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Insert variant_attributes if provided
    if (attribute_value_ids && attribute_value_ids.length > 0) {
      const attrs = attribute_value_ids.map(avid => ({
        variant_id: newVariant.id,
        attribute_value_id: avid,
      }));
      const { error: attrErr } = await admin.from('variant_attributes').insert(attrs as never);
      if (attrErr) return NextResponse.json({ error: attrErr.message }, { status: 500 });
    }
    return NextResponse.json(newVariant, { status: 201 });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}
