import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const admin = createAdminSupabaseClient();
    const { data: collection, error } = await admin
      .from('collections')
      .select(`id, name_ar, name_en, description_ar, description_en, collection_products(sort_order, products(id, name_ar, name_en, slug, base_price, discount_percentage, created_at, product_images(url, is_primary), product_variants(id, price_syp, price_override, stock_quantity, is_active)))`)
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('has_standalone_page', true)
      .maybeSingle();
    if (error) throw error;
    if (!collection) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const products = (collection.collection_products ?? [])
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .flatMap((entry) => entry.products ? [entry.products] : [])
      .map((product) => {
        const variants = (product.product_variants ?? []).filter((variant) => variant.is_active);
        const prices = variants.map((variant) => Number(variant.price_override ?? variant.price_syp)).filter(Number.isFinite);
        const basePrice = prices.length ? Math.min(...prices) : Number(product.base_price ?? 0);
        const discount = Number(product.discount_percentage ?? 0);
        const price = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
        const images = [...(product.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
        const defaultVariant = variants.find((variant) => Number(variant.stock_quantity ?? 0) > 0) ?? variants[0] ?? null;
        return {
          id: product.id,
          slug: product.slug,
          name_ar: product.name_ar,
          name_en: product.name_en,
          price,
          compare_price: discount > 0 ? basePrice : null,
          discount_percentage: discount || null,
          image_url: images[0]?.url ?? '',
          total_stock: variants.reduce((sum, variant) => sum + Number(variant.stock_quantity ?? 0), 0),
          default_variant_id: defaultVariant?.id ?? null,
          variants_count: variants.length,
          created_at: product.created_at,
        };
      });

    return NextResponse.json({ collection: { id: collection.id, name_ar: collection.name_ar, name_en: collection.name_en, description_ar: collection.description_ar, description_en: collection.description_en }, products });
  } catch (error) {
    console.error('[GET /api/collections/[slug]]', error);
    return NextResponse.json({ error: 'collection_unavailable' }, { status: 500 });
  }
}
