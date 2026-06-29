// @ts-nocheck
/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

/* -----------------------------------------------------------------------
 * GET /api/catalog/filters
 * Query params (all optional, comma-separated for multi-select):
 *   categories  = "shoes,bags"
 *   brands      = "nike,adidas"
 *   attrs       = "color:red,color:blue,size:42"   (type_slug:value_slug pairs)
 *   minPrice    = 50000
 *   maxPrice    = 200000
 *   q           = "search text"
 *   featured    = "1"
 *
 * Returns:
 *   { products, facets: { categories, brands, attributes, priceRange } }
 * --------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(req.url);

    // ── parse params ──────────────────────────────────────────────────
    const categorySlugList = (searchParams.get('categories') ?? '').split(',').filter(Boolean);
    const brandSlugList    = (searchParams.get('brands')     ?? '').split(',').filter(Boolean);
    const attrPairs        = (searchParams.get('attrs')      ?? '').split(',').filter(Boolean);
    const minPrice         = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
    const maxPrice         = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
    const q                = searchParams.get('q')?.trim() ?? '';
    const featuredOnly     = searchParams.get('featured') === '1';

    // attrPairs → { typeSlug → Set<valueSlug> }
    const selectedAttrMap: Record<string, Set<string>> = {};
    for (const pair of attrPairs) {
      const [typeSlug, valueSlug] = pair.split(':');
      if (typeSlug && valueSlug) {
        if (!selectedAttrMap[typeSlug]) selectedAttrMap[typeSlug] = new Set();
        selectedAttrMap[typeSlug].add(valueSlug);
      }
    }

    // ── fetch lookup tables in parallel ───────────────────────────────
    const [catsRes, brandsRes, attrTypesRes] = await Promise.all([
      supabase.from('categories').select('id,name_ar,name_en,slug').eq('is_active', true).order('sort_order'),
      supabase.from('brands').select('id,name,slug').eq('is_active', true).order('name'),
      supabase.from('attribute_types').select('id,name_ar,name_en,slug').order('slug'),
    ]);

    const allCats    = catsRes.data    ?? [];
    const allBrands  = brandsRes.data  ?? [];
    const allAttrTypes = attrTypesRes.data ?? [];

    // ── build lookup maps ─────────────────────────────────────────────
    const catBySlug:   Record<string, any> = {};
    const catById:     Record<string, any> = {};
    const brandBySlug: Record<string, any> = {};
    const brandById:   Record<string, any> = {};
    const attrTypeBySlug: Record<string, any> = {};

    for (const c of allCats)   { catBySlug[c.slug] = c; catById[c.id] = c; }
    for (const b of allBrands) { brandBySlug[b.slug] = b; brandById[b.id] = b; }
    for (const t of allAttrTypes) { attrTypeBySlug[t.slug] = t; }

    const selectedCatIds   = categorySlugList.map(s => catBySlug[s]?.id).filter(Boolean);
    const selectedBrandIds = brandSlugList.map(s => brandBySlug[s]?.id).filter(Boolean);

    // ── fetch attribute values for selected types ─────────────────────
    const selectedTypeIds = Object.keys(selectedAttrMap)
      .map(s => attrTypeBySlug[s]?.id).filter(Boolean);

    // Fetch ALL attribute values (for building facets)
    const { data: allAttrValues } = await supabase
      .from('attribute_values')
      .select('id,attribute_type_id,value_ar,value_en,hex_color,sort_order')
      .order('sort_order');

    const attrValueById: Record<string, any> = {};
    const attrValuesByTypeId: Record<string, any[]> = {};
    for (const v of (allAttrValues ?? [])) {
      attrValueById[v.id] = v;
      if (!attrValuesByTypeId[v.attribute_type_id]) attrValuesByTypeId[v.attribute_type_id] = [];
      attrValuesByTypeId[v.attribute_type_id].push(v);
    }

    // ── fetch ALL active products with their variants and attributes ───
    let productsQuery = supabase
      .from('products')
      .select(`
        id, name_ar, name_en, slug, description_ar, image_url,
        category_id, brand_id, is_featured, is_active,
        product_variants!inner(
          id, price_syp, compare_price_syp, stock_quantity, is_active,
          variant_attributes(
            attribute_value_id
          )
        )
      `)
      .eq('is_active', true)
      .eq('product_variants.is_active', true);

    const { data: rawProducts } = await productsQuery;

    // ── normalise product data ────────────────────────────────────────
    type NormProduct = {
      id: string; name_ar: string; name_en: string; slug: string;
      description_ar: string; image_url: string;
      category_id: string; brand_id: string;
      is_featured: boolean;
      minPrice: number; maxPrice: number;
      attrValueIds: Set<string>;
    };

    const products: NormProduct[] = [];

    for (const p of (rawProducts ?? [])) {
      const variants = Array.isArray(p.product_variants) ? p.product_variants : [];
      if (!variants.length) continue; // skip products with no active variants

      const prices = variants.map((v: any) => Number(v.price_syp)).filter(n => !isNaN(n));
      if (!prices.length) continue;

      const attrValueIds = new Set<string>();
      for (const v of variants) {
        for (const va of (v.variant_attributes ?? [])) {
          attrValueIds.add(va.attribute_value_id);
        }
      }

      products.push({
        id:           p.id,
        name_ar:      p.name_ar,
        name_en:      p.name_en,
        slug:         p.slug,
        description_ar: p.description_ar ?? '',
        image_url:    p.image_url ?? '',
        category_id:  p.category_id,
        brand_id:     p.brand_id,
        is_featured:  p.is_featured,
        minPrice:     Math.min(...prices),
        maxPrice:     Math.max(...prices),
        attrValueIds,
      });
    }

    // ── filter predicate ──────────────────────────────────────────────
    function matchesFilters(
      p: NormProduct,
      opts: {
        skipCategory?: boolean;
        skipBrand?: boolean;
        skipAttrTypeId?: string;
        skipPrice?: boolean;
      } = {}
    ): boolean {
      // text search
      if (q) {
        const ql = q.toLowerCase();
        if (!p.name_ar.toLowerCase().includes(ql) && !p.name_en.toLowerCase().includes(ql)) return false;
      }
      // featured
      if (featuredOnly && !p.is_featured) return false;

      // category filter
      if (!opts.skipCategory && selectedCatIds.length > 0) {
        if (!selectedCatIds.includes(p.category_id)) return false;
      }

      // brand filter
      if (!opts.skipBrand && selectedBrandIds.length > 0) {
        if (!selectedBrandIds.includes(p.brand_id)) return false;
      }

      // price filter
      if (!opts.skipPrice) {
        if (minPrice !== null && p.maxPrice < minPrice) return false;
        if (maxPrice !== null && p.minPrice > maxPrice) return false;
      }

      // attribute filters (each type is AND, values within a type are OR)
      for (const [typeSlug, valueSlugSet] of Object.entries(selectedAttrMap)) {
        if (opts.skipAttrTypeId && attrTypeBySlug[typeSlug]?.id === opts.skipAttrTypeId) continue;

        const typeId = attrTypeBySlug[typeSlug]?.id;
        if (!typeId) continue;

        const valuesOfType = attrValuesByTypeId[typeId] ?? [];
        const targetValueIds = valuesOfType
          .filter(v => valueSlugSet.has(v.value_en?.toLowerCase().replace(/\s+/g, '-') ?? ''))
          .map(v => v.id);

        // allow matching by id directly too (value sent as id)
        const targetIds = new Set([
          ...targetValueIds,
          ...[...valueSlugSet].filter(s => s.match(/^[0-9a-f-]{36}$/i)),
        ]);

        if (targetIds.size === 0) continue;
        if (![...p.attrValueIds].some(id => targetIds.has(id))) return false;
      }

      return true;
    }

    // ── apply full filter for result products ─────────────────────────
    const filteredProducts = products.filter(p => matchesFilters(p));

    // ── compute facets ────────────────────────────────────────────────

    // categories facet — exclude category filter to show cross-filtering
    const catCounts: Record<string, number> = {};
    for (const p of products) {
      if (matchesFilters(p, { skipCategory: true })) {
        catCounts[p.category_id] = (catCounts[p.category_id] ?? 0) + 1;
      }
    }
    const categoriesFacet = allCats
      .filter(c => catCounts[c.id] !== undefined)
      .map(c => ({ ...c, count: catCounts[c.id] ?? 0, selected: selectedCatIds.includes(c.id) }));

    // brands facet — exclude brand filter
    const brandCounts: Record<string, number> = {};
    for (const p of products) {
      if (matchesFilters(p, { skipBrand: true })) {
        brandCounts[p.brand_id] = (brandCounts[p.brand_id] ?? 0) + 1;
      }
    }
    const brandsFacet = allBrands
      .filter(b => brandCounts[b.id] !== undefined)
      .map(b => ({ ...b, count: brandCounts[b.id] ?? 0, selected: selectedBrandIds.includes(b.slug) }));

    // attribute facets — dynamic for every attribute type
    const attributesFacet: any[] = [];
    for (const attrType of allAttrTypes) {
      const valuesOfType = attrValuesByTypeId[attrType.id] ?? [];
      if (!valuesOfType.length) continue;

      const selectedValueSlugs = selectedAttrMap[attrType.slug] ?? new Set();

      const valueCounts: Record<string, number> = {};
      for (const p of products) {
        if (!matchesFilters(p, { skipAttrTypeId: attrType.id })) continue;
        for (const vid of p.attrValueIds) {
          const val = attrValueById[vid];
          if (val && val.attribute_type_id === attrType.id) {
            valueCounts[vid] = (valueCounts[vid] ?? 0) + 1;
          }
        }
      }

      const values = valuesOfType
        .filter(v => valueCounts[v.id] !== undefined)
        .map(v => {
          const valueSlug = v.value_en?.toLowerCase().replace(/\s+/g, '-') ?? v.id;
          return {
            id:        v.id,
            slug:      valueSlug,
            value_ar:  v.value_ar,
            value_en:  v.value_en,
            hex_color: v.hex_color,
            count:     valueCounts[v.id] ?? 0,
            selected:  selectedValueSlugs.has(valueSlug) || selectedValueSlugs.has(v.id),
          };
        });

      if (values.length === 0) continue;

      attributesFacet.push({
        id:       attrType.id,
        slug:     attrType.slug,
        name_ar:  attrType.name_ar,
        name_en:  attrType.name_en,
        values,
      });
    }

    // price range facet — from all products matching everything except price
    const priceProducts = products.filter(p => matchesFilters(p, { skipPrice: true }));
    const allPrices = priceProducts.flatMap(p => [p.minPrice, p.maxPrice]);
    const priceRangeFacet = allPrices.length
      ? { min: Math.min(...allPrices), max: Math.max(...allPrices) }
      : { min: 0, max: 0 };

    // ── build response products (strip internal fields) ───────────────
    const responseProducts = filteredProducts.map(p => ({
      id:           p.id,
      name_ar:      p.name_ar,
      name_en:      p.name_en,
      slug:         p.slug,
      description_ar: p.description_ar,
      image_url:    p.image_url,
      category_id:  p.category_id,
      brand_id:     p.brand_id,
      is_featured:  p.is_featured,
      minPrice:     p.minPrice,
    }));

    return NextResponse.json({
      products: responseProducts,
      total: responseProducts.length,
      facets: {
        categories: categoriesFacet,
        brands:     brandsFacet,
        attributes: attributesFacet,
        priceRange: priceRangeFacet,
      },
    });
  } catch (err: any) {
    console.error('[catalog/filters] error:', err);
    return NextResponse.json({ error: 'server_error', detail: String(err?.message ?? err) }, { status: 500 });
  }
}
