import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { GET as getCatalog } from '@/app/api/catalog/filters/route';
import { createAdminSupabaseClient } from '@/supabase-server';

export async function GET(request: NextRequest) {
  const response = await getCatalog(request);
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !payload) return NextResponse.json(payload ?? { error: 'catalog_query_failed' }, { status: response.status });
  const products = Array.isArray(payload.data) ? payload.data as Array<Record<string, unknown>> : [];
  const productIds = products.map((product) => String(product.id ?? '')).filter(Boolean);
  const variantsByProduct = new Map<string, Array<{ id: string; stock_quantity: number; price_syp: number }>>();

  if (productIds.length) {
    const admin = createAdminSupabaseClient();
    const { data: variants, error } = await admin
      .from('product_variants')
      .select('id, product_id, stock_quantity, price_syp, price_override')
      .in('product_id', productIds)
      .eq('is_active', true)
      .order('price_syp', { ascending: true });
    if (error) return NextResponse.json({ error: 'catalog_variants_unavailable' }, { status: 500 });

    for (const variant of variants ?? []) {
      if (!variant.product_id) continue;
      const current = variantsByProduct.get(variant.product_id) ?? [];
      current.push({
        id: variant.id,
        stock_quantity: Number(variant.stock_quantity ?? 0),
        price_syp: Number(variant.price_override ?? variant.price_syp ?? 0),
      });
      variantsByProduct.set(variant.product_id, current);
    }
  }

  const enrichedProducts = products.map((product) => {
    const variants = variantsByProduct.get(String(product.id)) ?? [];
    const defaultVariant = variants.find((variant) => variant.stock_quantity > 0) ?? variants[0] ?? null;
    return {
      ...product,
      default_variant_id: defaultVariant?.id ?? null,
      default_variant_stock: defaultVariant?.stock_quantity ?? 0,
      has_multiple_variants: variants.length > 1,
    };
  });

  return NextResponse.json({
    data: enrichedProducts, total: payload.total ?? 0, page: payload.page ?? 1,
    per_page: payload.per_page ?? 24, filters: payload.filters ?? {},
  });
}
