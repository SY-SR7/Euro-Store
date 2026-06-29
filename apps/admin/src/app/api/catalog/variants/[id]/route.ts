import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/supabase-server';
import { z } from 'zod';

const updateSchema = z.object({
  sku:               z.string().min(1).optional(),
  price_syp:         z.number().nonnegative().optional(),
  compare_price_syp: z.number().nonnegative().nullable().optional(),
  stock_quantity:    z.number().int().nonnegative().optional(),
  is_active:         z.boolean().optional(),
});

interface RouteParams { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body: unknown = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const admin = await requireAdminClient();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await admin.from('product_variants').update(parsed.data as any).eq('id', params.id).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { error } = await admin.from('product_variants').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}