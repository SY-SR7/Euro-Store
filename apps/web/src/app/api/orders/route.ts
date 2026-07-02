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
    
    // Unconditionally load settings if user is authenticated (needed for both earn and redeem)
    let settings: Record<string, number> = {};
    if (user) {
      const { data: sysSet } = await supabase.from('system_settings').select('key, value').in('key', [
        'loyalty_redeem_value_syp', 'loyalty_redeem_points',
        'loyalty_earn_amount_syp', 'loyalty_earn_points'
      ]);
      settings = Object.fromEntries(((sysSet ?? []) as { key: string; value: string }[]).map((s) => [s.key, Number(s.value)]));
    }

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

    // ── Check if Customer is required ──
    // Guests can checkout if we allow it, but we should make sure we don't leak anything.
    // If guest checkout is allowed, customer_id will be null.

    // ── Execute Atomic Checkout RPC ──
    const rpcPayload = {
      p_order_number:         orderNumber,
      p_customer_id:          user?.id ?? null,
      p_address_snapshot:     address_snapshot,
      p_subtotal_syp:         server_subtotal_syp,
      p_discount_syp:         server_discount_syp,
      p_discount_code_id:     discount_id ?? null,
      p_loyalty_discount_syp: server_loyalty_discount_syp,
      p_loyalty_points_used:  actualPointsUsed,
      p_shipping_syp:         server_shipping_syp,
      p_total_syp:            server_total_syp,
      p_notes:                notes ?? null,
      p_items:                server_items,
      p_points_earned:        user && server_total_syp > 0 ? (Math.floor(server_total_syp / (settings?.['loyalty_earn_amount_syp'] ?? 1000)) * (settings?.['loyalty_earn_points'] ?? 10)) : 0
    };

    const { data: orderId, error: orderErr } = await supabase.rpc('place_order_atomic', rpcPayload);

    if (orderErr || !orderId) {
      console.error('[orders/POST] RPC error:', orderErr);
      return NextResponse.json({ error: 'database_error' }, { status: 500 });
    }

    // ── Send order confirmation email (best-effort, non-blocking) ──
    // Moving this inside the POST function so it has scope access!
    void (async () => {
      try {
        const resendKey  = process.env['RESEND_API_KEY'] ?? '';
        const fromEmail  = process.env['EMAIL_FROM'] ?? 'orders@eurostore.com';
        
        const toEmail = user?.email;
        if (!toEmail || !resendKey) return;

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
