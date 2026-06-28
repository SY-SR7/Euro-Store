import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { z } from 'zod';

const itemSchema = z.object({
  variant_id:  z.string().uuid(),
  quantity:    z.number().int().min(1),
  unit_price:  z.number().nonnegative(),
  total_price: z.number().nonnegative(),
});

const addressSchema = z.object({
  full_name:   z.string().min(2),
  phone:       z.string().min(7),
  governorate: z.string().min(1),
  address:     z.string().min(5),
  notes:       z.string().nullable().optional(),
});

const orderSchema = z.object({
  address_snapshot: addressSchema,
  items:            z.array(itemSchema).min(1),
  subtotal_syp:     z.number().nonnegative(),
  shipping_syp:     z.number().nonnegative().default(0),
  total_syp:        z.number().nonnegative(),
  notes:            z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase    = createSupabaseServerClientFromEnv(cookieStore);

    // Get optional logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    // Generate unique order number via RPC
    const { data: orderNum, error: numErr } = await supabase.rpc('generate_order_number');
    if (numErr || !orderNum) {
      return NextResponse.json({ error: 'order_number_failed' }, { status: 500 });
    }

    const { address_snapshot, items, subtotal_syp, shipping_syp, total_syp, notes } = parsed.data;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number:     orderNum as string,
        customer_id:      user?.id ?? null,
        address_snapshot: address_snapshot,
        subtotal_syp:     subtotal_syp,
        discount_syp:     0,
        loyalty_discount_syp: 0,
        shipping_syp:     shipping_syp,
        total_syp:        total_syp,
        notes:            notes ?? null,
        status:           'pending',
        payment_status:   'pending',
        payment_method:   'cash_on_delivery',
      })
      .select('id, order_number')
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: orderErr?.message ?? 'order_failed' }, { status: 500 });
    }

    // Fetch product info for snapshots
    const variantIds = items.map(i => i.variant_id);
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, sku, price_syp, product_id, products(name_ar, name_en, slug)')
      .in('id', variantIds);

    const variantMap = new Map((variants ?? []).map(v => [v.id, v]));

    const orderItems = items.map(i => {
      const v = variantMap.get(i.variant_id);
      const product = (v?.products as { name_ar: string; name_en: string; slug: string } | null);
      return {
        order_id:        order.id,
        variant_id:      i.variant_id,
        quantity:        i.quantity,
        unit_price_syp:  i.unit_price,
        total_price_syp: i.total_price,
        product_snapshot: {
          sku:      v?.sku ?? '',
          name_ar:  product?.name_ar ?? '',
          name_en:  product?.name_en ?? '',
          slug:     product?.slug ?? '',
          price:    i.unit_price,
        },
      };
    });

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) {
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    return NextResponse.json({ order_number: order.order_number }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}