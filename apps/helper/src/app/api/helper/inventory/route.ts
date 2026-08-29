import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { requireHelperContext } from '@/lib/helper-context';

const SELECT = `
  id, sku, stock_quantity, low_stock_threshold, is_active, product_id,
  products!inner (
    id, name_ar, name_en, slug, is_active,
    product_images ( url, is_primary, sort_order )
  )
`;

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireHelperContext();
    if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 100) ?? '';
    const baseVariants = () => ctx.admin
      .from('product_variants')
      .select(SELECT)
      .eq('is_active', true)
      .eq('products.is_active', true)
      .order('stock_quantity', { ascending: true })
      .limit(100);

    if (!query) {
      const { data, error } = await baseVariants();
      if (error) throw error;
      return NextResponse.json(data ?? []);
    }

    const pattern = `%${query}%`;
    const [skuResult, arabicResult, englishResult] = await Promise.all([
      baseVariants().ilike('sku', pattern),
      ctx.admin.from('products').select('id').eq('is_active', true).ilike('name_ar', pattern).limit(50),
      ctx.admin.from('products').select('id').eq('is_active', true).ilike('name_en', pattern).limit(50),
    ]);
    if (skuResult.error) throw skuResult.error;
    if (arabicResult.error) throw arabicResult.error;
    if (englishResult.error) throw englishResult.error;

    const productIds = [...new Set([
      ...(arabicResult.data ?? []).map((product) => product.id),
      ...(englishResult.data ?? []).map((product) => product.id),
    ])];
    const nameResult = productIds.length > 0
      ? await baseVariants().in('product_id', productIds)
      : { data: [], error: null };
    if (nameResult.error) throw nameResult.error;

    const byId = new Map<string, unknown>();
    for (const item of [...(skuResult.data ?? []), ...(nameResult.data ?? [])]) byId.set(item.id, item);
    return NextResponse.json([...byId.values()]);
  } catch (error) {
    console.error('[GET /api/helper/inventory]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
