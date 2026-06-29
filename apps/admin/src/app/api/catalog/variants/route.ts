import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const schema = z.object({
  product_id:        z.string().uuid(),
  sku:               z.string().min(1),
  price_syp:         z.number().nonnegative(),
  compare_price_syp: z.number().nonnegative().nullable().optional(),
  stock_quantity:    z.number().int().nonnegative().default(0),
  color:             z.string().optional().nullable(),
  size:              z.string().optional().nullable(),
  is_active:         z.boolean().default(true),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const product_id = searchParams.get('product_id') ?? '';
  const admin = createAdminSupabaseClient();
  let query = admin
    .from('product_variants')
    .select('id,product_id,sku,price_syp,compare_price_syp,stock_quantity,color,size,is_active')
    .order('price_syp');
  if (product_id) query = query.eq('product_id', product_id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from('product_variants').insert(parsed.data as never).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}