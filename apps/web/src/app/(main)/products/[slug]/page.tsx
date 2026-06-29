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

export default function ProductPage({ params }: { params: any }) {
  const [slug, setSlug] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [selColor, setSelColor] = useState('');
  const [selSize, setSelSize] = useState('');

  const addItem = useCartStore(s => s.addItem);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let alive = true;

    Promise.resolve(params).then((p: any) => {
      if (!alive) return;
      setSlug(p?.slug ?? '');
    });

    return () => {
      alive = false;
    };
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

      if (!prod) {
        setProduct(null);
        setVariants([]);
        setImages([]);
        setCategory(null);
        setBrand(null);
        setSelected(null);
        setMainImage(null);
        setLoading(false);
        return;
      }

      setProduct(prod);

      const [vRes, iRes, catRes, brRes] = await Promise.all([
        supabase
          .from('product_variants')
          .select('id,sku,price_syp,compare_price_syp,stock_quantity,color,size,attributes')
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
      const firstVariant = vList[0] ?? null;

      setVariants(vList);
      setImages(iList);
      setCategory(catRes.data ?? null);
      setBrand(brRes.data ?? null);
      setSelected(firstVariant);
      setSelColor(firstVariant?.color ?? '');
      setSelSize(firstVariant?.size ?? '');

      const primary =
        iList.find((i: any) => i.is_primary)?.url ??
        iList[0]?.url ??
        prod.image_url ??
        null;

      setMainImage(primary);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  const colors = [...new Set(variants.filter((v: any) => v.color).map((v: any) => v.color))];
  const sizes = [...new Set(variants.filter((v: any) => v.size).map((v: any) => v.size))];
  const selectedStock = selected?.stock_quantity ?? 0;

  const pickVariant = (color?: string, size?: string) => {
    const c = color ?? selColor;
    const s = size ?? selSize;

    const match = variants.find((v: any) =>
      (!c || v.color === c) &&
      (!s || v.size === s)
    );

    if (match) setSelected(match);
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
          <Link href="/products" className="text-[#C9A84C] hover:underline">
            عودة للمنتجات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" dir="rtl">
      <nav className="mb-6 flex items-center gap-2 text-xs text-[#6F6658]">
        <Link href="/" className="hover:text-[#C9A84C] transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[#C9A84C] transition-colors">المنتجات</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/categories/${category.slug}`} className="hover:text-[#C9A84C] transition-colors">
              {category.name_ar}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[#1F1B16]">{product.name_ar}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
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
                <button
                  key={img.id}
                  onClick={() => setMainImage(img.url)}
                  className={[
                    'h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-colors',
                    mainImage === img.url ? 'border-[#C9A84C]' : 'border-transparent hover:border-[#C9A84C]/50',
                  ].join(' ')}
                >
                  <img src={img.url} alt={img.alt_ar ?? ''} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {brand && <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">{brand.name}</p>}

          <h1 className="text-3xl font-black text-[#171411] leading-tight">{product.name_ar}</h1>

          {product.name_en && <p className="text-sm text-[#6F6658]" dir="ltr">{product.name_en}</p>}

          {selected ? (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#171411]">{formatSYP(selected.price_syp)}</span>
              {selected.compare_price_syp && selected.compare_price_syp > selected.price_syp && (
                <span className="text-lg text-[#9CA3AF] line-through">
                  {formatSYP(selected.compare_price_syp)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xl text-[#6F6658]">اختر متغيراً لعرض السعر</p>
          )}

          <div>
            {selectedStock > 10 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                ✓ متوفر في المخزون
              </span>
            ) : selectedStock > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                ⚠ كميات محدودة ({selectedStock} قطعة)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">
                ✗ نفذ المخزون
              </span>
            )}
          </div>

          {colors.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#3C352C]">
                اللون: <span className="font-normal text-[#6F6658]">{selColor || 'اختر'}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c: any) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelColor(c);
                      pickVariant(c, undefined);
                    }}
                    className={[
                      'rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-all',
                      selColor === c
                        ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#1F1B16]'
                        : 'border-[#E8DCC3] text-[#3C352C] hover:border-[#C9A84C]',
                    ].join(' ')}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#3C352C]">
                المقاس: <span className="font-normal text-[#6F6658]">{selSize || 'اختر'}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s: any) => {
                  const v = variants.find((vv: any) => vv.size === s && (!selColor || vv.color === selColor));
                  const avail = v && v.stock_quantity > 0;

                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setSelSize(s);
                        pickVariant(undefined, s);
                      }}
                      disabled={!avail}
                      className={[
                        'rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all',
                        selSize === s
                          ? 'border-[#C9A84C] bg-[#C9A84C] text-[#111]'
                          : avail
                            ? 'border-[#E8DCC3] text-[#3C352C] hover:border-[#C9A84C]'
                            : 'border-[#E8DCC3] text-[#C9A84C]/30 line-through cursor-not-allowed',
                      ].join(' ')}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {colors.length === 0 && sizes.length === 0 && variants.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#3C352C]">اختر المتغير</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className={[
                      'rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all',
                      selected?.id === v.id
                        ? 'border-[#C9A84C] bg-[#C9A84C] text-[#111]'
                        : 'border-[#E8DCC3] text-[#3C352C] hover:border-[#C9A84C]',
                    ].join(' ')}
                  >
                    {v.sku} — {formatSYP(v.price_syp)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.description_ar && (
            <div className="rounded-2xl bg-[#F8F5EF] p-5">
              <p className="text-sm leading-relaxed text-[#3C352C]">{product.description_ar}</p>
            </div>
          )}

          {selected && selectedStock > 0 ? (
            <button
              onClick={handleAddToCart}
              className={[
                'w-full rounded-2xl py-4 text-base font-black transition-all',
                added ? 'bg-green-600 text-white' : 'bg-[#C9A84C] text-[#111] hover:bg-[#D8B95F] active:scale-[0.98]',
              ].join(' ')}
            >
              {added ? '✓ تمت الإضافة إلى السلة' : 'أضف إلى السلة'}
            </button>
          ) : selected && selectedStock === 0 ? (
            <button disabled className="w-full rounded-2xl bg-[#E8DCC3] py-4 text-base font-black text-[#9CA3AF] cursor-not-allowed">
              نفذ المخزون
            </button>
          ) : (
            <button disabled className="w-full rounded-2xl bg-[#E8DCC3] py-4 text-base font-black text-[#9CA3AF] cursor-not-allowed">
              اختر المتغير أولاً
            </button>
          )}

          {category && (
            <p className="text-xs text-[#6F6658]">
              التصنيف:{' '}
              <Link href={`/categories/${category.slug}`} className="text-[#C9A84C] hover:underline">
                {category.name_ar}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
