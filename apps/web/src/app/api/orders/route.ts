import { NextResponse } from 'next/server';
import { createInAppNotification, dispatchPendingNotifications } from '@eurostore/database';
import type { Database } from '@eurostore/database';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';
import { z } from 'zod';
import { GOVERNORATES } from '@eurostore/shared';

const itemSchema = z.object({
  variant_id:  z.string().uuid(),
  quantity:    z.number().int().min(1),
  item_type:   z.enum(['variant', 'bundle']).optional().default('variant'),
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
  address_id:          z.string().uuid().optional(),
  address_snapshot:    addressSchema.optional(),
  items:               z.array(itemSchema).min(1).max(100).optional(),
  payment_method:      z.enum(['cod', 'cash_on_delivery', 'sham_cash']).optional().default('cod'),
  idempotency_key:     z.string().trim().min(1).max(128).nullable().optional(),
  discount_id:         z.string().uuid().nullable().optional(),
  discount_code:       z.string().trim().min(1).nullable().optional(),
  loyalty_points_used: z.number().int().nonnegative().default(0),
  loyalty_points_to_use: z.number().int().nonnegative().optional(),
  notes:               z.string().nullable().optional(),
}).superRefine((value, ctx) => {
  if (!value.address_id && !value.address_snapshot) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address_id'], message: 'address_id_or_snapshot_required' });
  }
});

function govIdToAr(id: string): string {
  const match = GOVERNORATES.find((g) => g.id === id);
  return match?.ar ?? id;
}

export async function GET() {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, payment_method, total_syp, created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0, page: 1, per_page: data?.length ?? 0 });
  } catch (error) {
    console.error('[orders/GET]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_input' },
        { status: 400 },
      );
    }

    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.email_confirmed_at) {
      return NextResponse.json({ error: 'email_not_verified' }, { status: 403 });
    }
    if (parsed.data.payment_method === 'sham_cash') {
      return NextResponse.json({ error: 'payment_method_unavailable' }, { status: 503 });
    }
    const idempotencyKey = (
      request.headers.get('idempotency-key')
      ?? parsed.data.idempotency_key
      ?? ''
    ).trim() || null;

    if (idempotencyKey && idempotencyKey.length > 128) {
      return NextResponse.json({ error: 'idempotency_key_too_long' }, { status: 400 });
    }

    if (idempotencyKey) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, order_number, payment_method')
        .eq('customer_id', user.id)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingOrder) {
        const existingPaymentMethod = existingOrder.payment_method === 'sham_cash' ? 'sham_cash' : 'cash_on_delivery';
        return NextResponse.json({
          order: { id: existingOrder.id, order_number: existingOrder.order_number },
          order_number: existingOrder.order_number,
          payment_required: existingPaymentMethod === 'sham_cash',
          payment_redirect_url: null,
          idempotent: true,
        });
      }
    }

    let {
      address_snapshot,
      items,
    } = parsed.data;
    const { discount_id, discount_code, notes } = parsed.data;
    const loyalty_points_used = parsed.data.loyalty_points_to_use ?? parsed.data.loyalty_points_used;
    const paymentMethod = 'cash_on_delivery';

    if (!address_snapshot && parsed.data.address_id) {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { data: address, error: addressError } = await supabase
        .from('customer_addresses')
        .select('full_name, phone, governorate, city, street')
        .eq('id', parsed.data.address_id)
        .eq('customer_id', user.id)
        .maybeSingle();
      if (addressError || !address) return NextResponse.json({ error: 'invalid_address' }, { status: 400 });
      address_snapshot = {
        full_name: address.full_name,
        phone: address.phone,
        governorate: address.governorate,
        address: [address.city, address.street].filter(Boolean).join(' - '),
        notes: null,
      };
    }

    if (!items?.length) {
      const admin = createAdminSupabaseClient();
      const [variantCart, bundleCart] = await Promise.all([
        admin.from('cart_items').select('product_variant_id, quantity, added_at')
          .eq('customer_id', user.id),
        admin.from('cart_bundle_items').select('bundle_id, quantity, added_at')
          .eq('customer_id', user.id),
      ]);
      if (variantCart.error || bundleCart.error) {
        return NextResponse.json({ error: 'cart_load_failed' }, { status: 500 });
      }
      items = [
        ...(variantCart.data ?? []).map((row) => ({
          variant_id: row.product_variant_id,
          quantity: Number(row.quantity ?? 1),
          item_type: 'variant' as const,
          added_at: row.added_at,
        })),
        ...(bundleCart.data ?? []).map((row) => ({
          variant_id: row.bundle_id,
          quantity: Number(row.quantity ?? 1),
          item_type: 'bundle' as const,
          added_at: row.added_at,
        })),
      ].sort((a, b) => String(a.added_at).localeCompare(String(b.added_at)))
        .map(({ added_at: _addedAt, ...item }) => item);
      if (!items.length) return NextResponse.json({ error: 'empty_cart' }, { status: 400 });
    }

    if (!address_snapshot) return NextResponse.json({ error: 'invalid_address' }, { status: 400 });

    // ── 1. Server-Side Pricing (Prevent Manipulation) ──
    const variantIds = items.filter(i => i.item_type === 'variant').map(i => i.variant_id);
    const bundleIds = items.filter(i => i.item_type === 'bundle').map(i => i.variant_id);

    const { data: variants } = await supabase
      .from('product_variants')
      .select(`
        id, sku, price_syp, price_override, is_active, product_id,
        products(id, category_id, name_ar, name_en, slug, base_price, discount_percentage,
          discount_start_at, discount_end_at, status, is_active)
      `)
      .in('id', variantIds.length > 0 ? variantIds : ['00000000-0000-0000-0000-000000000000']);

    const { data: bundles } = await supabase
      .from('product_bundles')
      .select('id, slug, name_ar, name_en, bundle_price, status')
      .in('id', bundleIds.length > 0 ? bundleIds : ['00000000-0000-0000-0000-000000000000']);

    const variantMap = new Map((variants ?? [])
      .filter((variant) => variant.is_active && variant.products?.is_active && variant.products?.status === 'published')
      .map((variant) => [variant.id, variant]));
    const bundleMap = new Map((bundles ?? [])
      .filter((bundle) => bundle.status === 'published')
      .map((bundle) => [bundle.id, bundle]));
    if (variantIds.some((id) => !variantMap.has(id)) || bundleIds.some((id) => !bundleMap.has(id))) {
      return NextResponse.json({ error: 'catalog_item_unavailable' }, { status: 409 });
    }

    let server_subtotal_syp = 0;
    const server_items = items.map((i) => {
      if (i.item_type === 'bundle') {
        const b = bundleMap.get(i.variant_id);
        if (!b) throw new Error('bundle_not_found');
        const price = Number(b.bundle_price);
        const total = price * i.quantity;
        server_subtotal_syp += total;
        return {
          variant_id: i.variant_id,
          item_type: 'bundle',
          quantity: i.quantity,
          unit_price_syp: price,
          total_price_syp: total,
          product_snapshot: {
            sku: 'BUNDLE-' + b.id.substring(0,6),
            name_ar: b.name_ar,
            name_en: b.name_en,
            slug: b.slug,
            price: price
          }
        };
      } else {
        const v = variantMap.get(i.variant_id);
        const product = (v?.products) ?? null;
        if (!v || !product) throw new Error('variant_not_found');

        const originalPrice = Number(v.price_override ?? product.base_price ?? v.price_syp ?? 0);
        const now = Date.now();
        const discountActive = product.discount_percentage !== null
          && (!product.discount_start_at || new Date(product.discount_start_at).getTime() <= now)
          && (!product.discount_end_at || new Date(product.discount_end_at).getTime() >= now);
        const price = discountActive
          ? Math.max(0, Math.round(originalPrice * (1 - Number(product.discount_percentage) / 100)))
          : originalPrice;
        const total = price * i.quantity;
        server_subtotal_syp += total;

        return {
          variant_id: i.variant_id,
          item_type: 'variant',
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
      }
    });

    // ── 2. Server-Side Discount Calculation ──
    let server_discount_syp = 0;
    let resolvedDiscountCodeId = discount_id ?? null;
    if (discount_id || discount_code) {
      let discountQuery = supabase
        .from('discount_codes')
        .select('*')
        .eq('is_active', true);
      discountQuery = discount_id
        ? discountQuery.eq('id', discount_id)
        : discountQuery.eq('code', String(discount_code).toUpperCase());
      const { data: discountCode } = await discountQuery.single();

      if (discountCode) {
        resolvedDiscountCodeId = discountCode.id;
        const validUntil = discountCode.valid_until;
        const validFrom = discountCode.valid_from;
        const minOrderForDiscount = Number(discountCode.min_order_syp ?? discountCode.min_cart_value ?? 0);
        const maxUses = Number(discountCode.max_uses ?? discountCode.max_uses_total ?? 0);
        const usesCount = Number(discountCode.used_count ?? discountCode.uses_count ?? 0);
        const isNotExpired = !validUntil || new Date(validUntil) >= new Date();
        const isStarted = !validFrom || new Date(validFrom) <= new Date();
        const hasUsesLeft = !maxUses || usesCount < maxUses;
        const maxUsesPerUser = Number(discountCode.max_uses_per_user ?? 0);
        const eligibility = discountCode.eligibility ?? 'all_users';
        const scope = discountCode.scope ?? 'entire_store';

        if (!isStarted) {
          return NextResponse.json({ error: 'discount_not_started' }, { status: 400 });
        }
        if (!isNotExpired) {
          return NextResponse.json({ error: 'discount_expired' }, { status: 400 });
        }

        if (eligibility === 'first_time_buyers') {
          const { count: previousOrderCount } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', user.id)
            .eq('status', 'completed');
          if ((previousOrderCount ?? 0) > 0) {
            return NextResponse.json({ error: 'discount_first_time_buyers_only' }, { status: 400 });
          }
        }

        if (server_subtotal_syp < minOrderForDiscount) {
          return NextResponse.json({ error: 'discount_min_cart_value_not_met', minCartValue: minOrderForDiscount }, { status: 400 });
        }

        const variantProductIds = new Set(
          server_items
            .filter((item) => item.item_type === 'variant')
            .map((item) => variantMap.get(item.variant_id)?.product_id)
            .filter(Boolean),
        );
        const variantCategoryIds = new Set(
          server_items
            .filter((item) => item.item_type === 'variant')
            .map((item) => variantMap.get(item.variant_id)?.products?.category_id)
            .filter(Boolean),
        );
        const productIds = new Set(discountCode.product_ids ?? []);
        const categoryIds = new Set(discountCode.category_ids ?? []);
        const scopeMatches = scope === 'entire_store'
          || (scope === 'products' && [...variantProductIds].some((id) => productIds.has(String(id))))
          || (scope === 'categories' && [...variantCategoryIds].some((id) => categoryIds.has(String(id))));

        if (!scopeMatches) {
          return NextResponse.json({ error: 'discount_scope_mismatch' }, { status: 400 });
        }
        if (!hasUsesLeft) {
          return NextResponse.json({ error: 'discount_usage_limit_reached' }, { status: 400 });
        }
        if (maxUsesPerUser > 0) {
          const { count: userUsageCount } = await supabase
            .from('discount_code_usages')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', user.id)
            .eq('discount_code_id', discountCode.id);
          if ((userUsageCount ?? 0) >= maxUsesPerUser) {
            return NextResponse.json({ error: 'discount_user_usage_limit_reached' }, { status: 400 });
          }
        }

        if (discountCode.type === 'percentage') {
          server_discount_syp = Math.floor(server_subtotal_syp * (Number(discountCode.value) / 100));
        } else {
          server_discount_syp = Number(discountCode.value);
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
    // Actually, we need some settings even for guests: min_order_value_syp
    const settingsAdmin = createAdminSupabaseClient();
    const { data: sysSet } = await settingsAdmin.from('system_settings').select('key, value').in('key', [
      'loyalty_point_value_syp', 'loyalty_min_redemption_pts', 'loyalty_max_redemption_pct',
      'loyalty_earn_amount_syp', 'loyalty_earn_points',
      'min_order_value_syp', 'free_shipping_global_threshold_syp'
    ]);
    const settings = Object.fromEntries((sysSet ?? []).map((setting) => [setting.key, Number(setting.value)]));

    const minOrderValue = settings.min_order_value_syp ?? 0;
    if (minOrderValue > 0 && (server_subtotal_syp - server_discount_syp) < minOrderValue) {
      return NextResponse.json({ error: 'min_order_value_not_met', minOrderValue }, { status: 400 });
    }

    if (loyalty_points_used > 0 && user) {
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('loyalty_points')
        .eq('id', user.id)
        .single();

      const available = profile?.loyalty_points ?? 0;
      if (loyalty_points_used > available) {
        return NextResponse.json({ error: 'insufficient_loyalty_points' }, { status: 400 });
      }

      const pointValue = settings.loyalty_point_value_syp ?? 10;
      const minRedemption = settings.loyalty_min_redemption_pts ?? 100;
      const maxRedemptionPct = settings.loyalty_max_redemption_pct ?? 30;
      if (loyalty_points_used < minRedemption) {
        return NextResponse.json({ error: 'loyalty_min_redemption_not_met', minRedemption }, { status: 400 });
      }

      const maxDiscountByPct = Math.floor(server_subtotal_syp * (maxRedemptionPct / 100));
      const maxPointsByPct = Math.floor(maxDiscountByPct / pointValue);
      actualPointsUsed = Math.min(loyalty_points_used, available, maxPointsByPct);
      if (actualPointsUsed < minRedemption) {
        return NextResponse.json({ error: 'loyalty_max_redemption_exceeded', maxPoints: maxPointsByPct }, { status: 400 });
      }

      server_loyalty_discount_syp = actualPointsUsed * pointValue;
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
    const globalFreeShipping = settings.free_shipping_global_threshold_syp || 0;
    const freeShippingThreshold = shippingRow?.free_shipping_threshold_syp ?? globalFreeShipping;
    if (freeShippingThreshold && server_subtotal_syp >= freeShippingThreshold) {
      server_shipping_syp = 0;
    }

    // ── 5. Compute Final Total ──
    const server_total_syp = Math.max(0, server_subtotal_syp - server_discount_syp - server_loyalty_discount_syp + server_shipping_syp);

    // ── Generate order number ──
    const { data: orderNum, error: numErr } = await settingsAdmin.rpc('generate_order_number');
    if (numErr || !orderNum) {
      return NextResponse.json({ error: 'order_number_failed' }, { status: 500 });
    }
    const orderNumber = orderNum;

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
      p_discount_code_id:     resolvedDiscountCodeId,
      p_loyalty_discount_syp: server_loyalty_discount_syp,
      p_loyalty_points_used:  actualPointsUsed,
      p_shipping_syp:         server_shipping_syp,
      p_total_syp:            server_total_syp,
      p_notes:                notes ?? null,
      p_items:                server_items,
      p_points_earned:        user && server_subtotal_syp > 0 ? (Math.floor(server_subtotal_syp / (settings?.loyalty_earn_amount_syp ?? 1000)) * (settings?.loyalty_earn_points ?? 10)) : 0,
      p_idempotency_key:      idempotencyKey,
    };

    const admin = createAdminSupabaseClient();
    type PlaceOrderArgs = Database['public']['Functions']['place_order_secure_atomic']['Args'];
    // Supabase's generator does not represent nullable SQL function arguments.
    const placeOrderArgs = {
      ...rpcPayload,
      p_payment_method: paymentMethod,
    } as unknown as PlaceOrderArgs;
    const { data: orderId, error: orderErr } = await admin.rpc('place_order_secure_atomic', placeOrderArgs);

    if (orderErr || !orderId) {
      console.error('[orders/POST] RPC error:', orderErr);
      if (idempotencyKey) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, order_number, payment_method')
          .eq('customer_id', user.id)
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle();
        if (existingOrder) {
          const existingPaymentMethod = existingOrder.payment_method === 'sham_cash' ? 'sham_cash' : 'cash_on_delivery';
          return NextResponse.json({
            order: { id: existingOrder.id, order_number: existingOrder.order_number },
            order_number: existingOrder.order_number,
            payment_required: existingPaymentMethod === 'sham_cash',
            payment_redirect_url: null,
            idempotent: true,
          });
        }
      }
      return NextResponse.json({ error: 'database_error' }, { status: 500 });
    }

    const [adminsRes, helpersRes] = await Promise.all([
      admin.from('admin_profiles').select('id').eq('is_active', true),
      admin.from('helper_profiles').select('id').eq('is_active', true),
    ]);

    await Promise.all([
      ...((adminsRes.data ?? []).map((adminRow) => createInAppNotification(admin, {
        recipientId: adminRow.id,
        recipientRole: 'admin',
        type: 'order_update',
        titleAr: 'طلب جديد بانتظار المعالجة',
        titleEn: 'New pending order',
        bodyAr: `تم إنشاء طلب جديد رقم ${orderNumber}`,
        bodyEn: `New order ${orderNumber} was submitted`,
        referenceId: orderId,
        referenceType: 'order',
        data: { order_number: orderNumber, payment_method: paymentMethod },
      }))),
      ...((helpersRes.data ?? []).map((helper) => createInAppNotification(admin, {
        recipientId: helper.id,
        recipientRole: 'helper',
        type: 'order_update',
        titleAr: 'طلب جديد بانتظار المعالجة',
        titleEn: 'New pending order',
        bodyAr: `تم إنشاء طلب جديد رقم ${orderNumber}`,
        bodyEn: `New order ${orderNumber} was submitted`,
        referenceId: orderId,
        referenceType: 'order',
        data: { order_number: orderNumber, payment_method: paymentMethod },
      }))),
    ]);

    await dispatchPendingNotifications(admin, 100);

    return NextResponse.json({
      order: { id: orderId, order_number: orderNumber },
      order_number: orderNumber,
      payment_required: false,
      payment_redirect_url: null,
    }, { status: 201 });
  } catch (err) {
    console.error('[orders/POST]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
