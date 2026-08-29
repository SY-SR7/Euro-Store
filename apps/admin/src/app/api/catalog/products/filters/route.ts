import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { TableRow } from '@/lib/database-types';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';

/* -----------------------------------------------------------------------
 * GET /api/catalog/products/filters  (admin)
 * Same faceted logic as web, but:
 *   - Uses service role (sees all products, not just active ones)
 *   - Includes is_active status filter
 *   - No RLS restrictions
 * --------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  const ctx = await requireAdminContext('product_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(req.url);

    const categorySlugList = (searchParams.get('categories') ?? '').split(',').filter(Boolean);
    const brandSlugList    = (searchParams.get('brands')     ?? '').split(',').filter(Boolean);
    const attrPairs        = (searchParams.get('attrs')      ?? '').split(',').filter(Boolean);
    const minPrice         = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
    const maxPrice         = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
    const q                = searchParams.get('q')?.trim() ?? '';
    const statusFilter     = searchParams.get('status') ?? 'all'; // all | active | inactive | featured

    const selectedAttrMap: Record<string, Set<string>> = {};
    for (const pair of attrPairs) {
      const [typeSlug, valueSlug] = pair.split(':');
      if (typeSlug && valueSlug) {
        if (!selectedAttrMap[typeSlug]) selectedAttrMap[typeSlug] = new Set();
        selectedAttrMap[typeSlug].add(valueSlug);
      }
    }

    // Fetch lookup tables
    const [catsRes, brandsRes, attrTypesRes, attrValuesRes] = await Promise.all([
      supabase.from('categories').select('id,name_ar,name_en,slug').order('sort_order'),
      supabase.from('brands').select('id,name,slug').order('name'),
      supabase.from('attribute_types').select('id,name_ar,name_en,slug').order('slug'),
      supabase.from('attribute_values').select('id,attribute_type_id,value_ar,value_en,hex_color,sort_order').order('sort_order'),
    ]);

    const allCats      = catsRes.data      ?? [];
    const allBrands    = brandsRes.data    ?? [];
    const allAttrTypes = attrTypesRes.data ?? [];
    const allAttrValues = attrValuesRes.data ?? [];

    type CategoryLookup = Pick<TableRow<'categories'>, 'id' | 'name_ar' | 'name_en' | 'slug'>;
    type BrandLookup = Pick<TableRow<'brands'>, 'id' | 'name' | 'slug'>;
    type AttributeTypeLookup = Pick<TableRow<'attribute_types'>, 'id' | 'name_ar' | 'name_en' | 'slug'>;
    type AttributeValueLookup = Pick<TableRow<'attribute_values'>, 'id' | 'attribute_type_id' | 'value_ar' | 'value_en' | 'hex_color' | 'sort_order'>;

    const catBySlug: Record<string, CategoryLookup> = {};
    const brandBySlug: Record<string, BrandLookup> = {};
    const attrTypeBySlug: Record<string, AttributeTypeLookup> = {};
    const attrValueById: Record<string, AttributeValueLookup> = {};
    const attrValuesByTypeId: Record<string, AttributeValueLookup[]> = {};

    for (const c of allCats) catBySlug[c.slug] = c;
    for (const b of allBrands) brandBySlug[b.slug] = b;
    for (const t of allAttrTypes) { attrTypeBySlug[t.slug] = t; }
    for (const v of allAttrValues) {
      attrValueById[v.id] = v;
      if (v.attribute_type_id) {
        if (!attrValuesByTypeId[v.attribute_type_id]) attrValuesByTypeId[v.attribute_type_id] = [];
        attrValuesByTypeId[v.attribute_type_id].push(v);
      }
    }

    const selectedCatIds = categorySlugList.flatMap((slug) => catBySlug[slug]?.id ?? []);
    const selectedBrandIds = brandSlugList.flatMap((slug) => brandBySlug[slug]?.id ?? []);

    // Fetch all products + variants + attributes (no is_active filter for admin)
    const { data: rawProducts } = await supabase
      .from('products')
      .select(`
        id, name_ar, name_en, slug, is_active, is_featured,
        category_id, brand_id, created_at,
        product_variants(
          id, price_syp, is_active,
          variant_attributes(attribute_value_id)
        )
      `)
      .order('created_at', { ascending: false });

    const productIds = (rawProducts ?? []).map((product) => product.id);
    const rawImages = productIds.length
      ? (await supabase
          .from('product_images')
          .select('product_id,url,is_primary,sort_order')
          .in('product_id', productIds)
          .order('sort_order')).data ?? []
      : [];

    const imageByProductId: Record<string, string> = {};
    for (const img of rawImages) {
      if (!img.product_id) continue;
      const current = imageByProductId[img.product_id];
      if (!current || img.is_primary) imageByProductId[img.product_id] = img.url;
    }

    type NormProduct = {
      id: string; name_ar: string; name_en: string; slug: string;
      image_url: string; is_active: boolean; is_featured: boolean;
      category_id: string | null; brand_id: string | null; created_at: string;
      minPrice: number; maxPrice: number;
      attrValueIds: Set<string>;
    };

    const products: NormProduct[] = [];
    for (const p of (rawProducts ?? [])) {
      const variants = Array.isArray(p.product_variants) ? p.product_variants : [];
      const prices = variants.map((variant) => Number(variant.price_syp)).filter(Number.isFinite);
      const attrValueIds = new Set<string>();
      for (const v of variants) {
        for (const va of (v.variant_attributes ?? [])) {
          attrValueIds.add(va.attribute_value_id);
        }
      }
      products.push({
        id: p.id, name_ar: p.name_ar, name_en: p.name_en, slug: p.slug,
        image_url: imageByProductId[p.id] ?? '', is_active: p.is_active ?? false, is_featured: p.is_featured ?? false,
        category_id: p.category_id, brand_id: p.brand_id, created_at: p.created_at ?? '',
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        attrValueIds,
      });
    }

    const matchesFilters = (p: NormProduct, opts: {
      skipCategory?: boolean; skipBrand?: boolean; skipAttrTypeId?: string; skipPrice?: boolean; skipStatus?: boolean;
    } = {}): boolean => {
      if (q) {
        const ql = q.toLowerCase();
        if (!p.name_ar.toLowerCase().includes(ql) && !p.name_en.toLowerCase().includes(ql) && !p.slug.includes(ql)) return false;
      }
      if (!opts.skipStatus) {
        if (statusFilter === 'active'   && !p.is_active)  return false;
        if (statusFilter === 'inactive' && p.is_active)   return false;
        if (statusFilter === 'featured' && !p.is_featured) return false;
      }
      if (!opts.skipCategory && selectedCatIds.length > 0 && (!p.category_id || !selectedCatIds.includes(p.category_id))) return false;
      if (!opts.skipBrand && selectedBrandIds.length > 0 && (!p.brand_id || !selectedBrandIds.includes(p.brand_id))) return false;
      if (!opts.skipPrice) {
        if (minPrice !== null && p.maxPrice < minPrice) return false;
        if (maxPrice !== null && p.minPrice > maxPrice) return false;
      }
      for (const [typeSlug, valueSlugSet] of Object.entries(selectedAttrMap)) {
        if (opts.skipAttrTypeId && attrTypeBySlug[typeSlug]?.id === opts.skipAttrTypeId) continue;
        const typeId = attrTypeBySlug[typeSlug]?.id;
        if (!typeId) continue;
        const valuesOfType = attrValuesByTypeId[typeId] ?? [];
        const targetValueIds = new Set([
          ...valuesOfType.filter(v => valueSlugSet.has(v.value_en?.toLowerCase().replace(/\s+/g, '-') ?? '')).map(v => v.id),
          ...[...valueSlugSet].filter(s => s.match(/^[0-9a-f-]{36}$/i)),
        ]);
        if (targetValueIds.size > 0 && ![...p.attrValueIds].some(id => targetValueIds.has(id))) return false;
      }
      return true;
    };

    const filteredProducts = products.filter(p => matchesFilters(p));

    // Facets
    const catCounts: Record<string, number> = {};
    for (const p of products) if (matchesFilters(p, { skipCategory: true }) && p.category_id) catCounts[p.category_id] = (catCounts[p.category_id] ?? 0) + 1;

    const brandCounts: Record<string, number> = {};
    for (const p of products) if (matchesFilters(p, { skipBrand: true }) && p.brand_id) brandCounts[p.brand_id] = (brandCounts[p.brand_id] ?? 0) + 1;

    const categoriesFacet = allCats.filter(c => catCounts[c.id]).map(c => ({ ...c, count: catCounts[c.id] ?? 0, selected: selectedCatIds.includes(c.id) }));
    const brandsFacet     = allBrands.filter(b => brandCounts[b.id]).map(b => ({ ...b, count: brandCounts[b.id] ?? 0, selected: selectedBrandIds.includes(b.slug) }));

    const attributesFacet: Array<{
      id: string;
      slug: string;
      name_ar: string;
      name_en: string;
      values: Array<{
        id: string;
        slug: string;
        value_ar: string;
        value_en: string;
        hex_color: string | null;
        count: number;
        selected: boolean;
      }>;
    }> = [];
    for (const attrType of allAttrTypes) {
      const valuesOfType = attrValuesByTypeId[attrType.id] ?? [];
      if (!valuesOfType.length) continue;
      const selectedValueSlugs = selectedAttrMap[attrType.slug] ?? new Set();
      const valueCounts: Record<string, number> = {};
      for (const p of products) {
        if (!matchesFilters(p, { skipAttrTypeId: attrType.id })) continue;
        for (const vid of p.attrValueIds) {
          const val = attrValueById[vid];
          if (val && val.attribute_type_id === attrType.id) valueCounts[vid] = (valueCounts[vid] ?? 0) + 1;
        }
      }
      const values = valuesOfType.filter(v => valueCounts[v.id]).map(v => {
        const valueSlug = v.value_en?.toLowerCase().replace(/\s+/g, '-') ?? v.id;
        return { id: v.id, slug: valueSlug, value_ar: v.value_ar, value_en: v.value_en, hex_color: v.hex_color, count: valueCounts[v.id] ?? 0, selected: selectedValueSlugs.has(valueSlug) || selectedValueSlugs.has(v.id) };
      });
      if (values.length) attributesFacet.push({ id: attrType.id, slug: attrType.slug, name_ar: attrType.name_ar, name_en: attrType.name_en, values });
    }

    const priceProducts = products.filter(p => matchesFilters(p, { skipPrice: true }));
    const allPrices = priceProducts.flatMap(p => [p.minPrice, p.maxPrice]);
    const priceRangeFacet = allPrices.length ? { min: Math.min(...allPrices), max: Math.max(...allPrices) } : { min: 0, max: 0 };

    return NextResponse.json({
      products: filteredProducts.map(p => ({
        id: p.id, name_ar: p.name_ar, name_en: p.name_en, slug: p.slug,
        image_url: p.image_url, is_active: p.is_active, is_featured: p.is_featured,
        category_id: p.category_id, brand_id: p.brand_id, created_at: p.created_at,
        minPrice: p.minPrice,
      })),
      total: filteredProducts.length,
      facets: { categories: categoriesFacet, brands: brandsFacet, attributes: attributesFacet, priceRange: priceRangeFacet },
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ error: 'server_error', detail }, { status: 500 });
  }
}
