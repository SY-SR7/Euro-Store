import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_variant_id' }, { status: 400 });

  const { user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: variant, error: variantError } = await admin
    .from('product_variants')
    .select('id, product_id, stock_quantity')
    .eq('id', parsed.data.id)
    .eq('is_active', true)
    .maybeSingle();

  if (variantError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!variant) return NextResponse.json({ error: 'variant_not_found' }, { status: 404 });
  if ((variant.stock_quantity ?? 0) > 0) return NextResponse.json({ error: 'variant_in_stock' }, { status: 409 });
  if (!variant.product_id) return NextResponse.json({ error: 'product_not_available' }, { status: 404 });

  const { data: product, error: productError } = await admin
    .from('products')
    .select('id, status')
    .eq('id', variant.product_id)
    .eq('status', 'published')
    .maybeSingle();

  if (productError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!product) return NextResponse.json({ error: 'product_not_available' }, { status: 404 });

  const { data, error } = await admin
    .from('notify_me_subscriptions')
    .upsert({
      customer_id: user.id,
      product_variant_id: variant.id,
      is_notified: false,
      created_at: new Date().toISOString(),
    }, { onConflict: 'customer_id,product_variant_id' })
    .select('id, product_variant_id, is_notified, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ subscription: data }, { status: 201 });
}
