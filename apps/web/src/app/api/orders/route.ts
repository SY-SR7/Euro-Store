/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { z } from 'zod';
import { GOVERNORATES } from '@eurostore/shared';

const itemSchema = z.object({
  variant_id:  z.string().uuid(),
  quantity:    z.number().int().min(1),
  // We completely ignore unit_price and total_price from client for security
});

const addressSchema = z.object({
  full_name:   z.string().min(2),
  phone:       z.string().min(7),
  governorate: z.string().min(1),
  address:     z.string().min(5),
  notes:       z.string().nullable().optional(),
});

const orderSchema = z.object({
  address_snapshot:    addressSchema,
  items:               z.array(itemSchema).min(1),
  discount_id:         z.string().uuid().nullable().optional(),
  loyalty_points_used: z.number().int().nonnegative().default(0),
  notes:               z.string().nullable().optional(),
});

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
    const { data: { user } } = await supabase.auth.getUser();

    const {
      address_snapshot,
      items,
      discount_id,
      loyalty_points_used,
      notes,
    } = parsed.data;

    // ── 1. Server-Side Pricing (Prevent Manipulation) ──
    const variantIds = items.map((i) => i.variant_id);
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, sku, price_syp, product_id, products(name_ar, name_en, slug)')
      .in('id', variantIds);

    const variantMap = new Map((variants ?? []).map((v: any) => [v.id, v]));

    let server_subtotal_syp = 0;
    const server_items = items.map((i) => {
      const v = variantMap.get(i.variant_id);
      if (!v) throw new Error('variant_not_found');
      
      const price = Number(v.price_syp);
      const total = price * i.quantity;
      server_subtotal_syp += total;

      const product = (v.products as { name_ar: string; name_en: string; slug: string } | null);
      return {
        variant_id: i.variant_id,
        quantity: i.quantity,
        unit_price_syp: price,
        total_price_syp: total,
        product_snapshot: {
          sku: v.sku ?? '',
          name_ar: product?.name_ar ?? '',
          name_en: product?.name_en ?? '',
          slug: product?.slug ?? '',
          price: price,
        }
      };
    });

    // ── 2. Server-Side Discount Calculation ──
    let server_discount_syp = 0;
    if (discount_id) {
      const { data: discountCode } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('id', discount_id)
        .eq('is_active', true)
        .single();
        
      if (discountCode) {
        const isNotExpired = !discountCode.end_date || new Date(discountCode.end_date) >= new Date();
        const isStarted = !discountCode.start_date || new Date(discountCode.start_date) <= new Date();
        const hasUsesLeft = !discountCode.max_uses || discountCode.used_count < discountCode.max_uses;
        
        if (isNotExpired && isStarted && hasUsesLeft) {
          if (discountCode.type === 'percentage') {
            server_discount_syp = Math.floor(server_subtotal_syp * (Number(discountCode.value) / 100));
          } else {
            server_discount_syp = Number(discountCode.value);
          }
        } else {
           return NextResponse.json({ error: 'invalid_discount_code' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'invalid_discount_code' }, { status: 400 });
      }
    }
    server_discount_syp = Math.min(server_discount_syp, server_subtotal_syp); // Cap discount

    // ── 3. Server-Side Loyalty Discount ──
    let server_loyalty_discount_syp = 0;
    let actualPointsUsed = 0;
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

      const { data: sysSet } = await supabase.from('system_settings').select('key, value').in('key', ['loyalty_redeem_value_syp', 'loyalty_redeem_points']);
      const settings = Object.fromEntries(((sysSet ?? []) as { key: string; value: string }[]).map((s) => [s.key, Number(s.value)]));
      
      const redeemValue = settings['loyalty_redeem_value_syp'] ?? 1000;
      const redeemPoints = settings['loyalty_redeem_points'] ?? 100;
      
      // Calculate max points they can use based on remaining subtotal
      const maxUsablePoints = Math.ceil(((server_subtotal_syp - server_discount_syp) / redeemValue) * redeemPoints);
      actualPointsUsed = Math.min(loyalty_points_used, maxUsablePoints);
      
      server_loyalty_discount_syp = Math.floor(actualPointsUsed / redeemPoints) * redeemValue;
    }

    // ── 4. Server-Side Shipping Rate ──
    const govAr = govIdToAr(address_snapshot.governorate);
    const { data: shippingRow } = await supabase
      .from('shipping_rates')
      .select('base_rate_syp, free_shipping_threshold_syp')
      .eq('governorate', govAr)
      .eq('is_active', true)
      .single();

    let server_shipping_syp = shippingRow?.base_rate_syp ?? 0;
    if (shippingRow?.free_shipping_threshold_syp && server_subtotal_syp >= shippingRow.free_shipping_threshold_syp) {
      server_shipping_syp = 0;
    }

    // ── 5. Compute Final Total ──
    const server_total_syp = Math.max(0, server_subtotal_syp - server_discount_syp - server_loyalty_discount_syp + server_shipping_syp);

    // ── Generate order number ──
    const { data: orderNum, error: numErr } = await supabase.rpc('generate_order_number');
    if (numErr || !orderNum) {
      return NextResponse.json({ error: 'order_number_failed' }, { status: 500 });
    }
    const orderNumber = orderNum as string;

    // ── Check & Deduct Inventory ──
    const stockItems = items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity }));
    const stockResult = await supabase.rpc('decrement_stock', { p_items: stockItems });
    if (stockResult.error) {
      console.error('[orders/POST] decrement_stock error:', stockResult.error);
      return NextResponse.json({ error: 'out_of_stock', details: stockResult.error.message }, { status: 400 });
    }

    // ── Insert order using Server calculations ──
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number:         orderNumber,
        customer_id:          user?.id ?? null,
        address_snapshot,
        subtotal_syp:         server_subtotal_syp,
        discount_syp:         server_discount_syp,
        discount_code_id:     discount_id ?? null,
        loyalty_discount_syp: server_loyalty_discount_syp,
        loyalty_points_used:  actualPointsUsed,
        shipping_syp:         server_shipping_syp,
        total_syp:            server_total_syp,
        notes:                notes ?? null,
        status:               'pending',
        payment_status:       'pending',
        payment_method:       'cash_on_delivery',
      })
      .select('id')
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: orderErr?.message ?? 'order_failed' }, { status: 500 });
    }

    const orderId = (order as { id: string }).id;

    const orderItemsToInsert = server_items.map((i) => ({ ...i, order_id: orderId }));
    const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (itemsErr) {
      // Best-effort manual rollback if items fail
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    // ── Increment discount code usage ──
    if (discount_id) {
      const rpcResult = await supabase.rpc('increment_discount_usage', { p_discount_id: discount_id });
      if (rpcResult.error) console.error('Failed to increment discount usage:', rpcResult.error);
    }

    // ── Award & Deduct Loyalty Points ──
    if (user && server_total_syp > 0) {
      const systemSettings = await supabase.from('system_settings').select('key, value').in('key', ['loyalty_earn_amount_syp', 'loyalty_earn_points']);
      const settings = Object.fromEntries(((systemSettings.data ?? []) as { key: string; value: string }[]).map((s) => [s.key, Number(s.value)]));
      const earnAmount = settings['loyalty_earn_amount_syp'] ?? 1000;
      const earnPoints = settings['loyalty_earn_points'] ?? 10;
      const pointsEarned = Math.floor(server_total_syp / earnAmount) * earnPoints;

      if (pointsEarned > 0) {
        await supabase.rpc('award_loyalty_points', {
          p_customer_id:      user.id,
          p_points:           pointsEarned,
          p_type:             'earned_purchase',
          p_reference_id:     orderId,
          p_processed_by_id:  user.id,
          p_processed_by_role:'customer' as never,
        });
        await supabase.from('orders').update({ loyalty_points_earned: pointsEarned }).eq('id', orderId);
      }

      if (actualPointsUsed > 0) {
        await supabase.rpc('award_loyalty_points', {
          p_customer_id:      user.id,
          p_points:           -actualPointsUsed,
          p_type:             'redeemed',
          p_reference_id:     orderId,
          p_processed_by_id:  user.id,
          p_processed_by_role:'customer' as never,
        });
      }
    }

    // ── Send order confirmation email (best-effort, non-blocking) ──
    // Moving this inside the POST function so it has scope access!
    void (async () => {
      try {
        const resendKey  = process.env['RESEND_API_KEY'] ?? '';
        const fromEmail  = process.env['EMAIL_FROM'] ?? 'orders@eurostore.com';
        if (!resendKey) return;

        // Note: the original schema doesn't collect user email unless they are logged in.
        // We will try to fetch the email from the user profile if possible.
        let toEmail = (body as any)?.email; // If frontend passed it
        if (!toEmail && user) toEmail = user.email;
        if (!toEmail) return;

        const { ResendEmailAdapter } = await import('@eurostore/adapters');
        const { buildOrderConfirmationHtml } = await import('@eurostore/shared/email/orderConfirmation');

        const emailHtml = buildOrderConfirmationHtml({
          orderNumber    : orderNumber,
          customerName   : address_snapshot.full_name,
          totalSyp       : server_total_syp,
          shippingSyp    : server_shipping_syp,
          governorateName: govAr,
          items          : server_items.map(i => ({ 
                             nameAr: i.product_snapshot.name_ar, 
                             sku: i.product_snapshot.sku, 
                             quantity: i.quantity, 
                             priceSyp: i.unit_price_syp 
                           })),
        });

        const mailer = new ResendEmailAdapter(resendKey, fromEmail);
        await mailer.send({ to: toEmail, subject: `تأكيد الطلب #${orderNumber} من يورو ستور`, html: emailHtml });
      } catch (err) { 
        console.error('Email failed to send:', err);
      }
    })();

    return NextResponse.json({ order_number: orderNumber }, { status: 201 });
  } catch (err) {
    console.error('[orders/POST]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
