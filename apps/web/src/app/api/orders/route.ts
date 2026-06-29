/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { z } from 'zod';
import { GOVERNORATES } from '@eurostore/shared';

const itemSchema = z.object({
  variant_id:  z.string().uuid(),
  quantity:    z.number().int().min(1),
  unit_price:  z.number().nonnegative(),
  total_price: z.number().nonnegative(),
});

const addressSchema = z.object({
  full_name:   z.string().min(2),
  phone:       z.string().min(7),
  governorate: z.string().min(1),   // governorate ID (e.g. "damascus")
  address:     z.string().min(5),
  notes:       z.string().nullable().optional(),
});

const orderSchema = z.object({
  address_snapshot:    addressSchema,
  items:               z.array(itemSchema).min(1),
  subtotal_syp:        z.number().nonnegative(),
  discount_syp:        z.number().nonnegative().default(0),
  discount_id:         z.string().uuid().nullable().optional(),
  loyalty_points_used: z.number().int().nonnegative().default(0),
  loyalty_discount_syp:z.number().nonnegative().default(0),
  notes:               z.string().nullable().optional(),
});

// Map governorate ID ¢ ™ Arabic name used in shipping_rates table
function govIdToAr(id: string): string {
  const match = GOVERNORATES.find((g) => g.id === id);
  return match?.ar ?? id;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    // Optional logged-in customer
    const { data: { user } } = await supabase.auth.getUser();

    const {
      address_snapshot,
      items,
      subtotal_syp,
      discount_syp,
      discount_id,
      loyalty_points_used,
      loyalty_discount_syp,
      notes,
    } = parsed.data;

    // ¢‚¬¢‚¬ Fetch real shipping rate ¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬
    const govAr = govIdToAr(address_snapshot.governorate);
    const { data: shippingRow } = await supabase
      .from('shipping_rates')
      .select('base_rate_syp, free_shipping_threshold_syp')
      .eq('governorate', govAr)
      .eq('is_active', true)
      .single();

    let shipping_syp = shippingRow?.base_rate_syp ?? 0;
    // Free shipping if subtotal >= threshold
    if (
      shippingRow?.free_shipping_threshold_syp &&
      subtotal_syp >= shippingRow.free_shipping_threshold_syp
    ) {
      shipping_syp = 0;
    }

    // ¢‚¬¢‚¬ Validate loyalty points if used ¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬
    if (loyalty_points_used > 0 && user) {
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('loyalty_points')
        .eq('id', user.id)
        .single();

      const available = (profile as { loyalty_points: number } | null)?.loyalty_points ?? 0;
      if (loyalty_points_used > available) {
        return NextResponse.json({ error: 'insufficient_loyalty_points' }, { status: 400 });
      }
    }

    // ¢‚¬¢‚¬ Compute total ¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬
    const total_syp = Math.max(
      0,
      subtotal_syp - discount_syp - loyalty_discount_syp + shipping_syp,
    );

    // ¢‚¬¢‚¬ Generate order number ¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬
    const { data: orderNum, error: numErr } = await supabase.rpc('generate_order_number');
    if (numErr || !orderNum) {
      return NextResponse.json({ error: 'order_number_failed' }, { status: 500 });
    }

    // ¢‚¬¢‚¬ Insert order ¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number:         orderNum as string,
        customer_id:          user?.id ?? null,
        address_snapshot,
        subtotal_syp,
        discount_syp,
        discount_code_id:     discount_id ?? null,
        loyalty_discount_syp,
        loyalty_points_used,
        shipping_syp,
        total_syp,
        notes:                notes ?? null,
        status:               'pending',
        payment_status:       'pending',
        payment_method:       'cash_on_delivery',
      })
      .select('id, order_number')
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: orderErr?.message ?? 'order_failed' }, { status: 500 });
    }

    // ¢‚¬¢‚¬ Fetch variant snapshots ¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬
    const variantIds = items.map((i) => i.variant_id);
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, sku, price_syp, product_id, products(name_ar, name_en, slug)')
      .in('id', variantIds);

    const variantMap = new Map((variants ?? []).map((v: any) => [v.id, v]));

    const orderItems = items.map((i) => {
      const v = variantMap.get(i.variant_id);
      const product = (v?.products as { name_ar: string; name_en: string; slug: string } | null);
      return {
        order_id:         (order as { id: string }).id,
        variant_id:       i.variant_id,
        quantity:         i.quantity,
        unit_price_syp:   i.unit_price,
        total_price_syp:  i.total_price,
        product_snapshot: {
          sku:     v?.sku ?? '',
          name_ar: product?.name_ar ?? '',
          name_en: product?.name_en ?? '',
          slug:    product?.slug ?? '',
          price:   i.unit_price,
        },
      };
    });

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) {
      await supabase.from('orders').delete().eq('id', (order as { id: string }).id);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    // ¢‚¬¢‚¬ Increment discount code usage ¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬
    if (discount_id) {
      // استخدام RPC إن وُجدت، أو UPDATE مباشر — ليس كليهما
      const rpcResult = await supabase.rpc('increment_discount_usage' as never, { p_discount_id: discount_id });
      if (rpcResult.error) {
        // fallback: قراءة القيمة الحالية ثم رفعها بمقدار 1
        const { data: cur } = await supabase.from('discount_codes').select('used_count').eq('id', discount_id).single() as any;
        const newCount = ((cur as any)?.used_count ?? 0) + 1;
        await supabase.from('discount_codes').update({ used_count: newCount } as never).eq('id', discount_id);
      }
    }

    // ¢‚¬¢‚¬ Award loyalty points (10 pts per 1000 SYP) ¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬¢‚¬
    if (user && total_syp > 0) {
      const systemSettings = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['loyalty_earn_amount_syp', 'loyalty_earn_points']);

      const settings = Object.fromEntries(
        ((systemSettings.data ?? []) as { key: string; value: string }[])
          .map((s) => [s.key, Number(s.value)])
      );
      const earnAmount = settings['loyalty_earn_amount_syp'] ?? 1000;
      const earnPoints = settings['loyalty_earn_points'] ?? 10;
      const pointsEarned = Math.floor(total_syp / earnAmount) * earnPoints;

      if (pointsEarned > 0) {
        await supabase.rpc('award_loyalty_points', {
          p_customer_id:      user.id,
          p_points:           pointsEarned,
          p_type:             'earned_purchase',
          p_reference_id:     (order as { id: string }).id,
          p_processed_by_id:  user.id,
          p_processed_by_role:'customer' as never,
        });

        await supabase
          .from('orders')
          .update({ loyalty_points_earned: pointsEarned })
          .eq('id', (order as { id: string }).id);
      }

      // Deduct loyalty points if used
      if (loyalty_points_used > 0) {
        await supabase.rpc('award_loyalty_points', {
          p_customer_id:      user.id,
          p_points:           -loyalty_points_used,
          p_type:             'redeemed',
          p_reference_id:     (order as { id: string }).id,
          p_processed_by_id:  user.id,
          p_processed_by_role:'customer' as never,
        });
      }
    }

    return NextResponse.json(
      { order_number: (order as { order_number: string }).order_number },
      { status: 201 },
    );
  } catch (err) {
    console.error('[orders/POST]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
/* -- Send order confirmation email (best-effort, non-blocking) -- */
void (async () => {
  try {
    const resendKey  = process.env['RESEND_API_KEY'] ?? '';
    const fromEmail  = process.env['EMAIL_FROM'] ?? 'orders@eurostore.com';
    if (!resendKey) return;

    const { ResendEmailAdapter }      = await import('@eurostore/adapters');
    const { buildOrderConfirmationHtml } = await import('@eurostore/shared/email/orderConfirmation');

    const emailHtml = buildOrderConfirmationHtml({
      orderNumber    : orderNumber as string,
      customerName   : body.full_name as string,
      totalSyp       : total as number,
      shippingSyp    : shippingCost as number,
      governorateName: govLabel as string,
      items          : (body.items as Array<{ nameAr: string; sku: string; quantity: number; priceSyp: number }>),
    });

    const mailer = new ResendEmailAdapter(resendKey, fromEmail);
    await mailer.send({ to: body.email as string, subject: `????? ????? #${orderNumber as string} ” ???? ????`, html: emailHtml });
  } catch (_) { /* email failures must never break checkout */ }
})();

