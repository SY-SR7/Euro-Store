import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const parsed = z.string().uuid().safeParse((await context.params).token);
  if (!parsed.success) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  try {
    const admin = createAdminSupabaseClient();
    const { data: customer, error: customerError } = await admin.from('customer_profiles').select('id, full_name').eq('wishlist_share_token', parsed.data).maybeSingle();
    if (customerError) throw customerError;
    if (!customer) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const { data, error } = await admin
      .from('wishlist_items')
      .select('id, product_id, created_at, products!inner(id, name_ar, name_en, slug, is_active, status, product_images(url, is_primary), product_variants(id, price_syp, price_override, stock_quantity, is_active))')
      .eq('customer_id', customer.id)
      .eq('products.is_active', true)
      .eq('products.status', 'published')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const items = (data ?? []).map((row) => {
      const product = row.products;
      const variants = (product?.product_variants ?? []).filter((variant) => variant.is_active);
      const prices = variants.map((variant) => Number(variant.price_override ?? variant.price_syp)).filter(Number.isFinite);
      const images = product?.product_images ?? [];
      return {
        wishlist_id: row.id,
        product_id: row.product_id,
        slug: product?.slug ?? '',
        name_ar: product?.name_ar ?? '',
        name_en: product?.name_en ?? '',
        image_url: images.find((image) => image.is_primary)?.url ?? images[0]?.url ?? '',
        min_price_syp: prices.length ? Math.min(...prices) : 0,
        in_stock: variants.some((variant) => Number(variant.stock_quantity ?? 0) > 0),
      };
    });
    return NextResponse.json({ owner_name: customer.full_name, items });
  } catch (error) {
    console.error('[GET /api/wishlist/shared/[token]]', error);
    return NextResponse.json({ error: 'wishlist_unavailable' }, { status: 500 });
  }
}
