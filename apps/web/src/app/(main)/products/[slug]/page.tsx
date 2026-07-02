// @ts-nocheck
/* eslint-disable */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { createServerSupabaseClient } from '@/supabase-server';
import { useCartStore } from '@/lib/cart/cartStore';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { Layers3, Package, Palette, Ruler, Barcode, Boxes, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useRecentStore } from '@/lib/recentStore';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import type { Metadata, ResolvingMetadata } from 'next';

function formatSYP(n: number) {
  return Number(n || 0).toLocaleString('ar-SY') + ' ل.س';
}

function variantTitle(v: any, td: any) {
  const parts = [v?.color, v?.size, v?.sku].filter(Boolean);
  return parts.length ? parts.join(' / ') : td('variant');
}

function stockState(qty: number, td: any) {
  if (qty <= 0) return { text: td('outOfStockLong'), Icon: XCircle, cls: 'bg-red-50 border-red-200 text-red-700' };
  if (qty <= 5) return { text: `${td('lowStock')} ${qty}`, Icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-700' };
  return { text: `${td('available')} ${qty}`, Icon: CheckCircle2, cls: 'bg-green-50 border-green-200 text-green-700' };
}

/*
export async function generateMetadata(
  { params }: { params: any },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params?.slug;
  if (!slug) return {};

  const supabase = createServerSupabaseClient();
  const { data: product } = await supabase
    .from('products')
    .select('name_ar, name_en, description_ar, description_en, image_url, primary_image_url')
    .eq('slug', slug)
    .single();

  if (!product) return {};

  const title = product.name_ar || product.name_en;
  const description = product.description_ar || product.description_en;
  const image = product.primary_image_url || product.image_url;

  return {
    title: `${title} | EuroStore`,
    description: description?.substring(0, 160),
    openGraph: {
      title: `${title} | EuroStore`,
      description: description?.substring(0, 160),
      images: image ? [image] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | EuroStore`,
      description: description?.substring(0, 160),
      images: image ? [image] : [],
    },
  };
}
*/

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
  
  const addRecent = useRecentStore((s) => s.addRecent);
  const locale = useLocale();
  const t = useTranslations('catalog');
  const td = useTranslations('productDetails');
  const isAr = locale === 'ar';

  const addItem = useCartStore((s: any) => s.addItem);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _wishlistProductId = product?.id ?? null;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let alive = true;
    Promise.resolve(params).then((p: any) => {
      if (alive) setSlug(p?.slug ?? '');
    });
    return () => { alive = false; };
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    let alive = true;

    (async () => {
      setLoading(true);

      const { data: prod } = await supabase
        .from('products')
        .select('id,name_ar,name_en,slug,description_ar,category_id,brand_id,is_featured')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (!alive) return;

      if (!prod) {
        setProduct(null);
        setVariants([]);
        setImages([]);
        setSelected(null);
        setMainImage(null);
        setLoading(false);
        return;
      }

      const [vRes, iRes, catRes, brRes] = await Promise.all([
        supabase
          .from('product_variants')
          .select('id,sku,price_syp,compare_price_syp,stock_quantity,color,size,attributes,is_active')
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
      const first = vList.find((v: any) => Number(v.stock_quantity ?? 0) > 0) ?? vList[0] ?? null;

      setProduct(prod);
      setVariants(vList);
      setImages(iList);
      setCategory(catRes.data ?? null);
      setBrand(brRes.data ?? null);
      setSelected(first);

      setMainImage(
        iList.find((i: any) => i.is_primary)?.url ??
        iList[0]?.url ??
        null
      );

      // Add to recent store
      const basePrice = first?.price_syp ?? prod.base_price_syp ?? 0;
      addRecent({
        id: prod.id,
        slug: prod.slug,
        nameAr: prod.name_ar,
        nameEn: prod.name_en,
        priceSyp: basePrice,
        imageUrl: prod.image_url,
        brandName: brRes.data?.name
      });

      setLoading(false);
    })();

    return () => { alive = false; };
  }, [slug]);

  const totalStock = useMemo(
    () => variants.reduce((sum: number, v: any) => sum + Number(v.stock_quantity ?? 0), 0),
    [variants]
  );

  const colors = useMemo(
    () => [...new Set(variants.map((v: any) => v.color).filter(Boolean))],
    [variants]
  );

  const sizes = useMemo(
    () => [...new Set(variants.map((v: any) => v.size).filter(Boolean))],
    [variants]
  );

  const selectedStock = Number(selected?.stock_quantity ?? 0);
  const selectedState = stockState(selectedStock, td);
  const StockIcon = selectedState.Icon;

  const attrs =
    selected?.attributes && typeof selected.attributes === 'object'
      ? Object.entries(selected.attributes).filter(([_, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      : [];

  function handleAddToCart() {
    if (!selected || !product || selectedStock <= 0) return;

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
    setTimeout(() => setAdded(false), 1800);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-[#6F6658]">{td('loading')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <ImageWithFallback kind="product" label={td('notFoundImage')} className="mx-auto h-40 w-40 rounded-3xl" />
          <p className="text-2xl font-black text-[#1F1B16]">{td('notFoundTitle')}</p>
          <Link href="/products" className="text-primary hover:underline">{td('backToProducts')}</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10" dir="rtl">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#6F6658]">
        <Link href="/" className="hover:text-primary">{td('home')}</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary">{td('products')}</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/categories/${category.slug}`} className="hover:text-primary">{isAr ? category.name_ar : (category.name_en || category.name_ar)}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-[#1F1B16]">{isAr ? product.name_ar : (product.name_en || product.name_ar)}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-3xl border border-black/5 bg-[#F3EDE3] shadow-sm">
            <ImageWithFallback
              src={mainImage}
              alt={isAr ? product.name_ar : (product.name_en || product.name_ar)}
              kind="product"
              label={td('productImage')}
              sublabel={isAr ? product.name_ar : (product.name_en || product.name_ar)}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-5 gap-2">
            {(images.length ? images : [{ id: 'fallback', url: product.image_url }]).map((img: any) => (
              <button
                key={img.id}
                onClick={() => setMainImage(img.url)}
                className={[
                  'aspect-square overflow-hidden rounded-xl border-2 bg-background-card transition-colors',
                  mainImage === img.url ? 'border-primary' : 'border-transparent hover:border-primary/50',
                ].join(' ')}
              >
                <ImageWithFallback
                  src={img.url}
                  alt={img.alt_ar ?? (isAr ? product.name_ar : (product.name_en || product.name_ar))}
                  kind="product"
                  label={td('image')}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {brand && <p className="text-xs font-semibold uppercase tracking-widest text-primary">{brand.name}</p>}

          <div>
            <h1 className="text-3xl font-black leading-tight text-[#171411]">{isAr ? product.name_ar : (product.name_en || product.name_ar)}</h1>
            {(!isAr && product.name_ar) && <p className="mt-1 text-sm text-[#6F6658]" dir="rtl">{product.name_ar}</p>}
            {(isAr && product.name_en) && <p className="mt-1 text-sm text-[#6F6658]" dir="ltr">{product.name_en}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-card px-3 py-1 text-xs font-bold text-[#6F6658]">
              <Layers3 className="h-3.5 w-3.5 text-primary" />
              {variants.length} {td('variant')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-card px-3 py-1 text-xs font-bold text-[#6F6658]">
              <Boxes className="h-3.5 w-3.5 text-primary" />
              {td('totalStock')} {totalStock}
            </span>
          </div>

          {selected ? (
            <div className="rounded-3xl border border-border bg-background-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-text-muted">{td('selectedVariant')}</p>
                  <p className="mt-1 text-lg font-black text-[#1F1B16]">{variantTitle(selected, td)}</p>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black text-[#171411]">{formatSYP(selected.price_syp)}</p>
                  {selected.compare_price_syp && selected.compare_price_syp > selected.price_syp && (
                    <p className="text-sm text-[#9CA3AF] line-through">{formatSYP(selected.compare_price_syp)}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selected.sku && (
                  <div className="rounded-2xl bg-background p-3 text-sm">
                    <p className="flex items-center gap-2 font-bold text-[#6F6658]"><Barcode className="h-4 w-4 text-primary" /> SKU</p>
                    <p className="mt-1 font-mono text-[#1F1B16]" dir="ltr">{selected.sku}</p>
                  </div>
                )}
                {selected.color && (
                  <div className="rounded-2xl bg-background p-3 text-sm">
                    <p className="flex items-center gap-2 font-bold text-[#6F6658]"><Palette className="h-4 w-4 text-primary" /> {td('color')}</p>
                    <p className="mt-1 font-black text-[#1F1B16]">{selected.color}</p>
                  </div>
                )}
                {selected.size && (
                  <div className="rounded-2xl bg-background p-3 text-sm">
                    <p className="flex items-center gap-2 font-bold text-[#6F6658]"><Ruler className="h-4 w-4 text-primary" /> {td('size')}</p>
                    <p className="mt-1 font-black text-[#1F1B16]">{selected.size}</p>
                  </div>
                )}
                <div className="rounded-2xl bg-background p-3 text-sm">
                  <p className="flex items-center gap-2 font-bold text-[#6F6658]"><Boxes className="h-4 w-4 text-primary" /> {td('stock')}</p>
                  <p className="mt-1 font-black text-[#1F1B16]">{selectedStock} {td('pieces')}</p>
                </div>
              </div>

              {attrs.length > 0 && (
                <div className="mt-3 rounded-2xl bg-background p-3 text-sm">
                  <p className="mb-2 flex items-center gap-2 font-bold text-[#6F6658]">
                    <Info className="h-4 w-4 text-primary" />
                    {td('extraDetails')}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {attrs.map(([k, v]: any) => (
                      <p key={k} className="rounded-xl bg-background-card px-3 py-2">
                        <span className="text-text-muted">{k}: </span>
                        <strong className="text-[#1F1B16]">{String(v)}</strong>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${selectedState.cls}`}>
                <StockIcon className="h-3.5 w-3.5" />
                {selectedState.text}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-background-card p-6 text-center">
              <p className="font-bold text-[#6F6658]">{td('noVariants')}</p>
            </div>
          )}

          {variants.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-black text-[#3C352C]">{td('chooseVariant')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {variants.map((v: any) => {
                  const qty = Number(v.stock_quantity ?? 0);
                  const active = selected?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelected(v)}
                      className={[
                        'rounded-2xl border p-3 text-right transition-all',
                        active
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-background-card hover:border-primary/60',
                      ].join(' ')}
                    >
                      <p className="font-black text-[#1F1B16]">{variantTitle(v, td)}</p>
                      <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                        {v.color && <span className="rounded-full bg-background px-2 py-1">{td('colorLabel')}: {v.color}</span>}
                        {v.size && <span className="rounded-full bg-background px-2 py-1">{td('sizeLabel')}: {v.size}</span>}
                        {v.sku && <span className="rounded-full bg-background px-2 py-1" dir="ltr">{v.sku}</span>}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-black text-primary">{formatSYP(v.price_syp)}</span>
                        <span className={qty > 0 ? 'text-xs font-bold text-green-700' : 'text-xs font-bold text-red-700'}>
                          {qty > 0 ? `${qty} ${td('pieces')}` : td('outOfStockShort')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.description_ar && (
            <div className="rounded-2xl bg-[#F8F5EF] p-5">
              <p className="text-sm leading-relaxed text-[#3C352C]">{isAr ? product.description_ar : (product.description_en || product.description_ar)}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {selected && selectedStock > 0 ? (
              <button
                onClick={handleAddToCart}
                className={[
                  'flex-1 rounded-2xl py-4 text-base font-black transition-all',
                  added ? 'bg-green-600 text-text-primary' : 'bg-primary text-text-primary hover:bg-[#D8B95F] active:scale-[0.98]',
                ].join(' ')}
              >
                {added ? td('addedToCart') : td('addToCart')}
              </button>
            ) : (
              <button disabled className="flex-1 rounded-2xl bg-[#E8DCC3] py-4 text-base font-black text-[#9CA3AF]">
                {selected ? td('outOfStockLong') : td('chooseVariantFirst')}
              </button>
            )}
            {product?.id && (
              <div className="rounded-2xl border border-border bg-background-card p-2">
                <WishlistButton productId={product.id} />
              </div>
            )}
          </div>

          {category && (
            <p className="text-xs text-[#6F6658]">
              {td('category')} 
              <Link href={`/categories/${category.slug}`} className="text-primary hover:underline">
                {isAr ? category.name_ar : (category.name_en || category.name_ar)}
              </Link>
            </p>
          )}
        </div>
      </div>

      {product?.id && (
        <div className="mt-16">
          <ReviewsSection productId={product.id} />
        </div>
      )}
      
      {/* Recently Viewed Products */}
      <RecentlyViewed />
    </main>
  );
}