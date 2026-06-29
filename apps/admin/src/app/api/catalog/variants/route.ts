import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/supabase-server';
import { z } from 'zod';

const schema = z.object({
  product_id:        z.string().uuid(),
  sku:               z.string().min(1),
  price_syp:         z.number().nonnegative(),
  compare_price_syp: z.number().nonnegative().nullable().default(null),
  stock_quantity:    z.number().int().nonnegative().default(0),
  is_active:         z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    const admin = await requireAdminClient();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await admin.from('product_variants').insert(parsed.data as any).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}