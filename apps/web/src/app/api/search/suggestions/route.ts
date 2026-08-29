import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { z } from 'zod';

const querySchema = z.object({
  q: z.string().trim().min(2).max(100),
  lang: z.enum(['ar', 'en']).default('ar'),
});

type CatalogSuggestion = { id: string; name_ar: string; name_en: string; slug: string };

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    q: req.nextUrl.searchParams.get('q'),
    lang: req.nextUrl.searchParams.get('lang') ?? 'ar',
  });
  if (!parsed.success) return NextResponse.json({ suggestions: [] });

  const { q, lang } = parsed.data;
  const admin = createSupabaseAdminClientFromEnv();
  const [catalogResult, categoryResult] = await Promise.all([
    admin.rpc('catalog_search_with_facets', {
      p_category_ids: [],
      p_brand_ids: [],
      p_attributes: {},
      p_search: q,
      p_featured_only: false,
      p_sort: 'popular',
      p_page: 1,
      p_per_page: 6,
    }),
    admin.from('categories').select('id, name_ar, name_en, slug').eq('is_active', true).limit(200),
  ]);

  if (catalogResult.error || categoryResult.error) {
    return NextResponse.json({ error: 'search_unavailable', suggestions: [] }, { status: 500 });
  }

  const normalizedQuery = q.toLocaleLowerCase(lang === 'ar' ? 'ar' : 'en');
  const categories = (categoryResult.data ?? []).filter((category) =>
    category.name_ar.toLocaleLowerCase('ar').includes(normalizedQuery)
    || category.name_en.toLocaleLowerCase('en').includes(normalizedQuery),
  ).slice(0, 2);
  const catalog = catalogResult.data && typeof catalogResult.data === 'object' && !Array.isArray(catalogResult.data)
    ? catalogResult.data as Record<string, unknown>
    : {};
  const products = Array.isArray(catalog.data) ? catalog.data as CatalogSuggestion[] : [];
  const isAr = lang === 'ar';
  const suggestions = [
    ...categories.map((category) => ({
      type: 'category' as const,
      id: category.id,
      name: isAr ? category.name_ar : category.name_en,
      slug: category.slug,
    })),
    ...products.slice(0, 8 - categories.length).map((product) => ({
      type: 'product' as const,
      id: product.id,
      name: isAr ? product.name_ar : product.name_en,
      slug: product.slug,
    })),
  ];

  return NextResponse.json({ suggestions });
}
