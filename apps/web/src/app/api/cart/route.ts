import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';
import { z } from 'zod';
type ProductPricing = {
  base_price: number | null;
  discount_percentage: number | null;
  discount_start_at: string | null;
  discount_end_at: string | null;
};
type VariantPricing = {
  price_override: number | null;
  price_syp: number;
  compare_price_syp: number | null;
};

const cartItemSchema = z.object({
  itemType: z.enum(['variant', 'bundle']).optional().default('variant'),
  itemId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(99),
}).refine((item) => item.itemId || item.variantId, { message: 'item_id_required' });

const cartSchema = z.array(cartItemSchema).max(100);

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function effectivePrice(variant: VariantPricing, product: ProductPricing, now: number): { price: number; compare: number | null } {
  const original = Number(variant.price_override ?? product.base_price ?? variant.price_syp ?? 0);
  const activeDiscount = product.discount_percentage !== null
    && (!product.discount_start_at || new Date(product.discount_start_at).getTime() <= now)
    && (!product.discount_end_at || new Date(product.discount_end_at).getTime() >= now);
  return {
    price: activeDiscount ? Math.max(0, Math.round(original * (1 - Number(product.discount_percentage) / 100))) : original,
    compare: activeDiscount ? Math.max(original, Number(variant.compare_price_syp ?? 0)) : variant.compare_price_syp,
  };
}

export async function GET() {
  const { user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const [variantResult, bundleResult] = await Promise.all([
    admin.from('cart_items').select(`
      id, quantity, added_at,
      product_variants!inner(
        id, product_id, sku, price_syp, price_override, compare_price_syp, stock_quantity, is_active,
        products!inner(
          id, slug, name_ar, name_en, base_price, discount_percentage,
          discount_start_at, discount_end_at, status, is_active,
          product_images(url, is_primary, sort_order)
        )
      )
    `).eq('customer_id', user.id),
    admin.from('cart_bundle_items').select(`
      id, quantity, added_at,
      product_bundles!inner(
        id, slug, name_ar, name_en, bundle_price, status,
        bundle_items(
          quantity,
          product_variant:product_variants!inner(
            id, stock_quantity, is_active,
            products!inner(id, status, is_active, product_images(url, is_primary, sort_order))
          )
        )
      )
    `).eq('customer_id', user.id),
  ]);

  if (variantResult.error || bundleResult.error) {
    return NextResponse.json({ error: 'cart_items_unavailable' }, { status: 500 });
  }

  const now = Date.now();
  const variants = (variantResult.data ?? []).flatMap((row) => {
    const variant = one(row.product_variants);
    const product = one(variant?.products);
    if (!variant?.is_active || !product?.is_active || product.status !== 'published' || Number(variant.stock_quantity ?? 0) <= 0) return [];
    const images = [...(product.product_images ?? [])].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
    const image = images.find((item) => item.is_primary) ?? images[0] ?? null;
    const pricing = effectivePrice(variant, product, now);
    return [{
      itemType: 'variant' as const,
      cartItemId: row.id,
      itemId: variant.id,
      variantId: variant.id,
      productId: product.id,
      productSlug: product.slug,
      nameAr: product.name_ar,
      nameEn: product.name_en,
      sku: variant.sku,
      priceSyp: pricing.price,
      comparePriceSyp: pricing.compare,
      imageUrl: image?.url ?? null,
      maxQuantity: Math.min(Number(variant.stock_quantity), 99),
      quantity: Math.min(Number(row.quantity), Number(variant.stock_quantity), 99),
      addedAt: row.added_at,
    }];
  });

  const bundles = (bundleResult.data ?? []).flatMap((row) => {
    const bundle = one(row.product_bundles);
    const bundleItems = bundle?.bundle_items ?? [];
    if (!bundle || bundle.status !== 'published' || !bundleItems.length) return [];
    const available = Math.min(...bundleItems.map((item) => {
      const variant = one(item.product_variant);
      const product = one(variant?.products);
      if (!variant?.is_active || !product?.is_active || product.status !== 'published') return 0;
      return Math.floor(Number(variant.stock_quantity ?? 0) / Number(item.quantity || 1));
    }));
    if (available <= 0) return [];
    const firstProduct = one(one(bundleItems[0]?.product_variant)?.products);
    const images = [...(firstProduct?.product_images ?? [])].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
    const image = images.find((item) => item.is_primary) ?? images[0] ?? null;
    return [{
      itemType: 'bundle' as const,
      cartItemId: row.id,
      itemId: bundle.id,
      variantId: bundle.id,
      productId: bundle.id,
      productSlug: bundle.slug,
      nameAr: bundle.name_ar,
      nameEn: bundle.name_en,
      sku: `BUNDLE-${String(bundle.id).slice(0, 6).toUpperCase()}`,
      priceSyp: Number(bundle.bundle_price),
      comparePriceSyp: null,
      imageUrl: image?.url ?? null,
      maxQuantity: Math.min(available, 99),
      quantity: Math.min(Number(row.quantity), available, 99),
      addedAt: row.added_at,
    }];
  });

  const cart = [...variants, ...bundles]
    .sort((a, b) => String(a.addedAt).localeCompare(String(b.addedAt)))
    .map(({ addedAt: _addedAt, ...item }) => item);
  return NextResponse.json({ cart });
}

export async function DELETE() {
  const { user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { error } = await admin.rpc('replace_customer_cart_v2', {
    p_customer_id: user.id,
    p_items: [],
  });
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const { user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const parsed = z.object({ cart: cartSchema }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const items = parsed.data.cart.map((item) => ({
      item_type: item.itemType,
      item_id: item.itemId ?? item.variantId,
      quantity: item.quantity,
    }));
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc('replace_customer_cart_v2', {
      p_customer_id: user.id,
      p_items: items,
    });
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    return NextResponse.json({ success: true, cart: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
}
