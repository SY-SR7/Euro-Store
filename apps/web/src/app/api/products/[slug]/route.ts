import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ProductBundleView } from '@/types/catalog';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/supabase-server';

const slugSchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = slugSchema.safeParse((await params).slug);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_slug' }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: product, error } = await admin.from('products').select(`
    id, name_ar, name_en, slug, description_ar, description_en, category_id, brand_id,
    size_guide_id, base_price, discount_percentage, discount_start_at, discount_end_at,
    tags, created_at, status,
    product_images(id, url, alt_ar, alt_en, is_primary, sort_order),
    product_videos(id, url, thumbnail_url, sort_order),
    product_variants(
      id, sku, price_syp, price_override, compare_price_syp, stock_quantity,
      low_stock_threshold, is_active,
      variant_attributes(attribute_values(id, value_ar, value_en, hex_color, attribute_types(id, name_ar, name_en, slug)))
    )
  `).eq('slug', parsed.data).eq('status', 'published').maybeSingle();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!product) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const now = Date.now();
  const [categoryResult, brandResult] = await Promise.all([
    product.category_id
      ? admin.from('categories').select('id, name_ar, name_en, slug, size_guide_id').eq('id', product.category_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    product.brand_id
      ? admin.from('brands').select('id, name, slug').eq('id', product.brand_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (categoryResult.error || brandResult.error) return NextResponse.json({ error: 'product_relations_unavailable' }, { status: 500 });
  const category = categoryResult.data;
  const brand = brandResult.data;
  const activeDiscount = product.discount_percentage !== null
    && (!product.discount_start_at || new Date(product.discount_start_at).getTime() <= now)
    && (!product.discount_end_at || new Date(product.discount_end_at).getTime() >= now);
  const variants = product.product_variants.filter((variant) => variant.is_active).map((variant) => {
    const originalPrice = variant.price_override ?? product.base_price ?? variant.price_syp;
    const discountedPrice = activeDiscount
      ? Math.max(0, Math.round(originalPrice * (1 - Number(product.discount_percentage) / 100)))
      : originalPrice;
    return {
      ...variant,
      price_syp: discountedPrice,
      compare_price_syp: activeDiscount ? Math.max(originalPrice, variant.compare_price_syp ?? 0) : variant.compare_price_syp,
    };
  }).sort((a, b) => a.price_syp - b.price_syp);

  const sizeGuideId = product.size_guide_id ?? category?.size_guide_id ?? null;
  const variantIds = variants.map((variant) => variant.id);
  const [sizeGuideResult, bundlesResult] = await Promise.all([
    sizeGuideId
      ? admin.from('size_guides').select('*').eq('id', sizeGuideId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    variantIds.length
      ? admin.from('bundle_items').select(`
          bundle_id,
          product_bundles(
            id, name_ar, name_en, slug, description_ar, description_en, bundle_price, status,
            bundle_items(id, quantity, product_variant:product_variants(id, sku, stock_quantity, is_active, products(id, name_ar, name_en, status, is_active, product_images(url, is_primary, sort_order))))
          )
        `).in('product_variant_id', variantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (sizeGuideResult.error || bundlesResult.error) {
    return NextResponse.json({ error: 'product_relations_unavailable' }, { status: 500 });
  }

  const bundles = new Map<string, ProductBundleView>();
  for (const row of bundlesResult.data ?? []) {
    const bundle = row.product_bundles;
    if (bundle?.id && bundle.status === 'published') bundles.set(bundle.id, bundle);
  }

  return NextResponse.json({
    product: {
      ...product,
      categories: category,
      brands: brand,
      product_variants: variants,
      product_images: [...product.product_images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      product_videos: [...product.product_videos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      is_on_sale: activeDiscount,
    },
    size_guide: sizeGuideResult.data,
    bundles: [...bundles.values()],
  });
}
