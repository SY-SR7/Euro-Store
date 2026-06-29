// @ts-nocheck
/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useCartStore } from '@/lib/cart/cartStore';

function formatSYP(n: number) {
  return Number(n || 0).toLocaleString('ar-SY') + ' ل.س';
}

// Extract grouped attribute options from variants
function getAttrGroups(variants: any[]) {
  const groups: Record<string, { typeId: string; typeAr: string; typeEn: string; slug: string; values: any[] }> = {};
  for (const v of variants) {
    for (const va of v.variant_attributes ?? []) {
      const av = va.attribute_values;
      if (!av) continue;
      const at = av.attribute_types;
      if (!at) continue;
      if (!groups[at.slug]) {
        groups[at.slug] = { typeId: at.id, typeAr: at.name_ar, typeEn: at.name_en, slug: at.slug, values: [] };
      }
      if (!groups[at.slug].values.find((x: any) => x.id === av.id)) {
        groups[at.slug].values.push(av);
      }
    }
  }
  // Sort values inside each group
  for (const g of Object.values(groups)) {
    g.values.sort((a, b) => a.sort_order - b.sort_order);
  }
  return Object.values(groups).sort((a, b) => {
    const order: Record<string, number> = { color: 0, size: 1 };
    return (order[a.slug] ?? 9) - (order[b.slug] ?? 9);
  });
}

// Find a variant that matches all selected attribute value IDs
function matchVariant(variants: any[], selectedAttrIds: Record<string, string>) {
  const needed = Object.values(selectedAttrIds).filter(Boolean);
  if (needed.length === 0) return variants[0] ?? null;
  return variants.find(v => {
    const vIds = (v.variant_attributes ?? []).map((va: any) => va.attribute_value_id).filter(Boolean);
    return needed.every(id => vIds.includes(id));
  }) ?? null;
}

// Check if a specific attribute value is available given current other selections
function isValueAvailable(variants: any[], slug: string, avId: string, selectedAttrIds: Record<string, string>) {
  const otherSelections = Object.entries(selectedAttrIds).filter(([s]) => s !== slug);
  return variants.some(v => {
    const vIds = (v.variant_attributes ?? []).map((va: any) => va.attribute_value_id).filter(Boolean);
    if (!vIds.includes(avId)) return false;
    if (v.stock_quantity <= 0) return false;
    return otherSelections.every(([, id]) => !id || vIds.includes(id));
  });
}

export default function ProductPage({ params }: { params: any }) {
  const [slug, setSlug]         = useState('');
  const [product, setProduct]   = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [images, setImages]     = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [brand, setBrand]       = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [added, setAdded]       = useState(false);
  // slug -> attribute_value_id
  const [selAttrIds, setSelAttrIds] = useState<Record<string, string>>({});

  const addItem = useCartStore(s => s.addItem);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let alive = true;
    Promise.resolve(params).then((p: any) => { if (alive) setSlug(p?.slug ?? ''); });
    return () => { alive = false; };
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const { data: prod } = await supabase
        .from('products')
        .select('id,name_ar,name_en,slug,description_ar,category_id,brand_id,image_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (!alive) return;
      if (!prod) { setProduct(null); setVariants([]); setImages([]); setLoading(false); return; }
      setProduct(prod);

      const [vRes, iRes, catRes, brRes] = await Promise.all([
        supabase
          .from('product_variants')
          .select(`
            id, sku, price_syp, compare_price_syp, stock_quantity,
            variant_attributes(
              attribute_value_id,
              attribute_values(
                id, value_ar, value_en, hex_color, sort_order,
                attribute_types(id, name_ar, name_en, slug)
              )
            )
          `)
          .eq('product_id', prod.id)
          .eq('is_active', true)
          .order('price_syp'),
        supabase
          .from('product_images')
          .select('id,url,alt_ar,is_primary,sort_order')
          .eq('product_id', prod.id)
          .order('sort_order'),
        prod.category_id
          ? supabase.from('categories').select('id,name_ar,slug').eq('id', prod.category_id).maybeSingle()
          : Promise.resolve({ data: null }),
        prod.brand_id
          ? supabase.from('brands').select('id,name,slug').eq('id', prod.brand_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (!alive) return;

      const vList = vRes.data ?? [];
      const iList = iRes.data ?? [];
      setVariants(vList);
      setImages(iList);
      setCategory(catRes.data ?? null);
      setBrand(brRes.data ?? null);

      // Auto-select first variant and pre-fill its attr ids
      const first = vList[0] ?? null;
      setSelected(first);
      if (first) {
        const ids: Record<string, string> = {};
        for (const va of first.variant_attributes ?? []) {
          const av = va.attribute_values;
          if (av?.attribute_types?.slug) ids[av.attribute_types.slug] = av.id;
        }
        setSelAttrIds(ids);
      }

      const primary = iList.find((i: any) => i.is_primary)?.url ?? iList[0]?.url ?? prod.image_url ?? null;
      setMainImage(primary);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [slug]);

  // When attr selection changes, find matching variant
  useEffect(() => {
    if (variants.length === 0) return;
    const match = matchVariant(variants, selAttrIds);
    setSelected(match);
  }, [selAttrIds, variants]);

  const attrGroups = getAttrGroups(variants);
  const selectedStock = selected?.stock_quantity ?? 0;

  const handlePickAttr = (slug: string, avId: string) => {
    setSelAttrIds(prev => ({ ...prev, [slug]: prev[slug] === avId ? '' : avId }));
  };

  const handleAddToCart = () => {
    if (!selected || !product) return;
    addItem({
      variantId: selected.id,
      productId: product.id,
      productSlug: product.slug,
      nameAr: product.name_ar,
      nameEn: product.name_en ?? '',
      sku: selected.sku,
      priceSyp: selected.price_syp,
      comparePriceSyp: selected.compare_price_syp ?? null,
      imageUrl: mainImage,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#C9A84C] border-t-transparent" />
          <p className="text-sm text-[#6F6658]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <p className="text-2xl text-[#1F1B16]">المنتج غير موجود</p>
          <Link href="/products" className="text-[#C9A84C] hover:underline">عودة للمنتجات</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" dir="rtl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-[#6F6658]">
        <Link href="/" className="hover:text-[#C9A84C] transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[#C9A84C] transition-colors">المنتجات</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/categories/${category.slug}`} className="hover:text-[#C9A84C] transition-colors">{category.name_ar}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-[#1F1B16]">{product.name_ar}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-3xl border border-black/5 bg-[#F3EDE3]">
            {mainImage ? (
              <img src={mainImage} alt={product.name_ar} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[#C9A84C]/30 text-6xl">◈</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: any) => (
                <button key={img.id} onClick={() => setMainImage(img.url)}
                  className={['h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-colors',
                    mainImage === img.url ? 'border-[#C9A84C]' : 'border-transparent hover:border-[#C9A84C]/50'].join(' ')}>
                  <img src={img.url} alt={img.alt_ar ?? ''} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {brand && <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">{brand.name}</p>}
          <h1 className="text-3xl font-black text-[#171411] leading-tight">{product.name_ar}</h1>
          {product.name_en && <p className="text-sm text-[#6F6658]" dir="ltr">{product.name_en}</p>}

          {/* Price */}
          {selected ? (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#171411]">{formatSYP(selected.price_syp)}</span>
              {selected.compare_price_syp && selected.compare_price_syp > selected.price_syp && (
                <span className="text-lg text-[#9CA3AF] line-through">{formatSYP(selected.compare_price_syp)}</span>
              )}
              {selected.compare_price_syp && selected.compare_price_syp > selected.price_syp && (
                <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-bold text-red-600">
                  -{Math.round((1 - selected.price_syp / selected.compare_price_syp) * 100)}%
                </span>
              )}
            </div>
          ) : (
            <p className="text-xl text-[#6F6658]">اختر خياراً لعرض السعر</p>
          )}

          {/* Stock badge */}
          <div>
            {selectedStock > 10 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">✓ متوفر في المخزون</span>
            ) : selectedStock > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">⚠ كميات محدودة ({selectedStock} قطعة)</span>
            ) : selected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">✗ نفذ المخزون</span>
            ) : null}
          </div>

          {/* Attribute selectors */}
          {attrGroups.map(group => (
            <div key={group.slug}>
              <p className="mb-2.5 text-sm font-bold text-[#3C352C]">
                {group.typeAr}
                {selAttrIds[group.slug] && (
                  <span className="font-normal text-[#6F6658] mr-1">
                    : {group.values.find(v => v.id === selAttrIds[group.slug])?.value_ar}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.values.map((av: any) => {
                  const isSelected = selAttrIds[group.slug] === av.id;
                  const avail = isValueAvailable(variants, group.slug, av.id, selAttrIds);

                  if (group.slug === 'color' && av.hex_color) {
                    // Color circles
                    return (
                      <button
                        key={av.id}
                        onClick={() => handlePickAttr(group.slug, av.id)}
                        disabled={!avail}
                        title={`${av.value_ar}${!avail ? ' (غير متوفر)' : ''}`}
                        className={['relative h-9 w-9 rounded-full transition-all border-2',
                          isSelected ? 'border-[#C9A84C] scale-110 shadow-lg' : avail ? 'border-transparent hover:border-[#C9A84C]/60 hover:scale-105' : 'border-transparent opacity-40 cursor-not-allowed',
                        ].join(' ')}
                        style={{ background: av.hex_color }}
                      >
                        {!avail && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="block h-px w-6 rotate-45 bg-white/70 rounded" />
                          </span>
                        )}
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-black drop-shadow">✓</span>
                        )}
                      </button>
                    );
                  }

                  // Text buttons (size, etc.)
                  return (
                    <button
                      key={av.id}
                      onClick={() => handlePickAttr(group.slug, av.id)}
                      disabled={!avail}
                      className={['rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all',
                        isSelected
                          ? 'border-[#C9A84C] bg-[#C9A84C] text-[#111]'
                          : avail
                            ? 'border-[#E8DCC3] text-[#3C352C] hover:border-[#C9A84C]'
                            : 'border-[#E8DCC3] text-[#C9A84C]/30 line-through cursor-not-allowed',
                      ].join(' ')}
                    >
                      {av.value_ar}
                      {av.value_en && av.value_en !== av.value_ar && (
                        <span className="mr-1 text-[10px] opacity-60">({av.value_en})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Fallback: no attributes, multiple variants */}
          {attrGroups.length === 0 && variants.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#3C352C]">اختر الخيار</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v: any) => (
                  <button key={v.id} onClick={() => setSelected(v)}
                    className={['rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all',
                      selected?.id === v.id ? 'border-[#C9A84C] bg-[#C9A84C] text-[#111]' : 'border-[#E8DCC3] text-[#3C352C] hover:border-[#C9A84C]'].join(' ')}>
                    {v.sku} — {formatSYP(v.price_syp)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description_ar && (
            <div className="rounded-2xl bg-[#F8F5EF] p-5">
              <p className="text-sm leading-relaxed text-[#3C352C]">{product.description_ar}</p>
            </div>
          )}

          {/* CTA */}
          {selected && selectedStock > 0 ? (
            <button onClick={handleAddToCart}
              className={['w-full rounded-2xl py-4 text-base font-black transition-all',
                added ? 'bg-green-600 text-white' : 'bg-[#C9A84C] text-[#111] hover:bg-[#D8B95F] active:scale-[0.98]'].join(' ')}>
              {added ? '✓ تمت الإضافة إلى السلة' : 'أضف إلى السلة'}
            </button>
          ) : selected && selectedStock === 0 ? (
            <button disabled className="w-full rounded-2xl bg-[#E8DCC3] py-4 text-base font-black text-[#9CA3AF] cursor-not-allowed">نفذ المخزون</button>
          ) : (
            <button disabled className="w-full rounded-2xl bg-[#E8DCC3] py-4 text-base font-black text-[#9CA3AF] cursor-not-allowed">اختر الخيار أولاً</button>
          )}

          {category && (
            <p className="text-xs text-[#6F6658]">
              التصنيف:{' '}
              <Link href={`/categories/${category.slug}`} className="text-[#C9A84C] hover:underline">{category.name_ar}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}