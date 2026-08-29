import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

function listParam(searchParams: URLSearchParams, ...names: string[]) {
  return names.flatMap((name) => searchParams.getAll(name).flatMap((value) => value.split(','))).map((value) => value.trim()).filter(Boolean);
}

function numericParam(searchParams: URLSearchParams, ...names: string[]) {
  for (const name of names) {
    const raw = searchParams.get(name);
    if (raw !== null && raw !== '') {
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 0) return value;
    }
  }
  return null;
}

function valueSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const sp = request.nextUrl.searchParams;
    const search = (sp.get('search') ?? sp.get('q') ?? '').trim();
    if (search.length > 100) return NextResponse.json({ error: 'search_too_long' }, { status: 400 });
    const [categoriesResult, brandsResult, typesResult, valuesResult] = await Promise.all([
      supabase.from('categories').select('id, slug').eq('is_active', true),
      supabase.from('brands').select('id, slug').eq('is_active', true),
      supabase.from('attribute_types').select('id, slug'),
      supabase.from('attribute_values').select('id, attribute_type_id, value_en'),
    ]);
    if (categoriesResult.error || brandsResult.error || typesResult.error || valuesResult.error) {
      return NextResponse.json({ error: 'catalog_configuration_unavailable' }, { status: 500 });
    }

    const categories = categoriesResult.data ?? [];
    const brands = brandsResult.data ?? [];
    const attributeTypes = typesResult.data ?? [];
    const attributeValues = valuesResult.data ?? [];
    const categoryTokens = listParam(sp, 'categories', 'category_id');
    const brandTokens = listParam(sp, 'brands', 'brand_id');
    const categoryIds = categories.filter((item) => categoryTokens.includes(item.id) || categoryTokens.includes(item.slug)).map((item) => item.id);
    const brandIds = brands.filter((item) => brandTokens.includes(item.id) || brandTokens.includes(item.slug)).map((item) => item.id);

    const selectedByType = new Map<string, Set<string>>();
    const addSelection = (typeSlug: string, token: string) => {
      const type = attributeTypes.find((item) => item.slug === typeSlug);
      if (!type) return;
      const ids = attributeValues
        .filter((value) => value.attribute_type_id === type.id && (value.id === token || valueSlug(value.value_en) === valueSlug(token)))
        .map((value) => value.id);
      if (!ids.length) return;
      const selected = selectedByType.get(type.slug) ?? new Set<string>();
      ids.forEach((id) => selected.add(id));
      selectedByType.set(type.slug, selected);
    };

    for (const pair of listParam(sp, 'attrs')) {
      const separator = pair.indexOf(':');
      if (separator > 0) addSelection(pair.slice(0, separator), pair.slice(separator + 1));
    }
    for (const type of attributeTypes) {
      const aliases = type.slug === 'color' ? ['colors', 'color'] : type.slug === 'size' ? ['sizes', 'size'] : [];
      for (const token of listParam(sp, `custom_${type.slug}`, ...aliases)) addSelection(type.slug, token);
    }
    const attributes = Object.fromEntries([...selectedByType.entries()].map(([slug, ids]) => [slug, [...ids]]));
    const page = Math.max(1, Math.floor(numericParam(sp, 'page') ?? 1));
    const perPage = Math.min(60, Math.max(1, Math.floor(numericParam(sp, 'per_page') ?? 24)));
    const isSale = sp.get('sale') === 'true' || sp.get('sale') === '1' || sp.get('on_sale') === 'true' || sp.get('has_discount') === 'true';
    const minDiscount = isSale ? 1 : numericParam(sp, 'discount_min', 'discountMin');
    const sort = ['newest', 'price_asc', 'price_desc', 'popular'].includes(sp.get('sort') ?? '') ? sp.get('sort')! : 'newest';

    const { data, error } = await supabase.rpc('catalog_search_with_facets', {
      p_category_ids: categoryIds,
      p_brand_ids: brandIds,
      p_attributes: attributes,
      ...(numericParam(sp, 'min_price', 'minPrice') !== null ? { p_min_price: numericParam(sp, 'min_price', 'minPrice') ?? undefined } : {}),
      ...(numericParam(sp, 'max_price', 'maxPrice') !== null ? { p_max_price: numericParam(sp, 'max_price', 'maxPrice') ?? undefined } : {}),
      ...(minDiscount !== null ? { p_discount_min: minDiscount } : {}),
      ...(search ? { p_search: search } : {}),
      p_featured_only: sp.get('featured') === '1' || sp.get('featured') === 'true',
      p_sort: sort,
      p_page: page,
      p_per_page: perPage,
    });
    if (error || !data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ error: 'catalog_query_failed' }, { status: 500 });
    }

    const result = data as Record<string, unknown>;
    return NextResponse.json({
      data: Array.isArray(result.data) ? result.data : [],
      products: Array.isArray(result.data) ? result.data : [],
      total: Number(result.total ?? 0),
      page: Number(result.page ?? page),
      per_page: Number(result.per_page ?? perPage),
      filters: result.filters ?? {},
      facets: result.filters ?? {},
    });
  } catch (error) {
    console.error('[GET /api/catalog/filters]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
