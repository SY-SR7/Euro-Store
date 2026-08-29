/* eslint-disable */
'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCartStore } from '@/lib/cart/cartStore';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { ProductSharing } from '@/components/product/ProductSharing';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { SimilarProducts } from '@/components/product/SimilarProducts';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { Layers3, Package, Palette, Ruler, Barcode, Boxes, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useRecentStore } from '@/lib/recentStore';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { SizeGuideModal } from '@/components/product/sizeguide/SizeGuideModal';
import { NotifyMeForm } from '@/components/product/notify/NotifyMeForm';
import { ProductBundlesList } from '@/components/product/bundles/ProductBundlesList';

const ATTR_PRIORITY: Record<string, number> = {
  color: 1,
  اللون: 1,
  Color: 1,
  size: 2,
  المقاس: 2,
  Size: 2,
  material: 3,
  الخامة: 3,
  Material: 3,
};

function getAttrPriority(typeAr?: string, typeEn?: string, typeSlug?: string): number {
  return (
    ATTR_PRIORITY[typeSlug?.toLowerCase() ?? ''] ??
    ATTR_PRIORITY[typeEn?.toLowerCase() ?? ''] ??
    ATTR_PRIORITY[typeAr ?? ''] ??
    99
  );
}

function variantTitle(v: any, isAr: boolean, td: any) {
  const parts: string[] = [];
  if (v?.dynamicAttrs) {
    v.dynamicAttrs.forEach((attr: any) => {
      parts.push(isAr ? attr.valueAr : (attr.valueEn || attr.valueAr));
    });
  }
  if (parts.length === 0 && v?.sku) parts.push(v.sku);
  return parts.length ? parts.join(' / ') : td('variant');
}

function stockState(qty: number, td: any) {
  if (qty <= 0) return { text: td('outOfStockLong'), Icon: XCircle, cls: 'bg-red-50 border-red-200 text-red-700' };
  if (qty <= 5) return { text: `${td('lowStock')} ${qty}`, Icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-700' };
  return { text: `${td('available')} ${qty}`, Icon: CheckCircle2, cls: 'bg-green-50 border-green-200 text-green-700' };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [sizeGuide, setSizeGuide] = useState<any>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [bundles, setBundles] = useState<any[]>([]);
  
  const addRecent = useRecentStore((s) => s.addRecent);
  const locale = useLocale();
  const t = useTranslations('catalog');
  const td = useTranslations('productDetails');
  const isAr = locale === 'ar';

  const addItem = useCartStore((s: any) => s.addItem);

  useEffect(() => {
    if (!slug) return;

    let alive = true;

    (async () => {
      setLoading(true);

      const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
      const payload = await response.json().catch(() => null) as { product?: any; size_guide?: any; bundles?: any[] } | null;
      const prod = response.ok ? payload?.product ?? null : null;

      if (!alive) return;

      if (!prod) {
        setProduct(null);
        setVariants([]);
        setImages([]);
        setVideos([]);
        setSelected(null);
        setMainImage(null);
        setSizeGuide(null);
        setBundles([]);
        setLoading(false);
        return;
      }

      const vList = (prod.product_variants ?? []).map((v: any) => {
        const dynamicAttrs = (v.variant_attributes ?? []).map((va: any) => {
          const val = va.attribute_values;
          if (!val) return null;
          return {
            typeSlug: val.attribute_types?.slug,
            typeAr: val.attribute_types?.name_ar,
            typeEn: val.attribute_types?.name_en,
            valueAr: val.value_ar,
            valueEn: val.value_en,
            hex: val.hex_color,
            sortOrder: val.sort_order ?? 0,
          };
        }).filter(Boolean);

        // Sort dynamicAttrs canonically so Color is ALWAYS first, Size is ALWAYS second, Material is ALWAYS third
        dynamicAttrs.sort((a: any, b: any) => {
          const pA = getAttrPriority(a.typeAr, a.typeEn, a.typeSlug);
          const pB = getAttrPriority(b.typeAr, b.typeEn, b.typeSlug);
          if (pA !== pB) return pA - pB;
          return (a.typeAr || '').localeCompare(b.typeAr || '');
        });

        return {
          ...v,
          dynamicAttrs
        };
      });

      const iList = prod.product_images ?? [];
      const first = vList.find((v: any) => Number(v.stock_quantity ?? 0) > 0) ?? vList[0] ?? null;
      
      const initialSelectedAttrs: Record<string, string> = {};
      if (first?.dynamicAttrs) {
        first.dynamicAttrs.forEach((attr: any) => {
          initialSelectedAttrs[attr.typeAr] = attr.valueAr;
        });
      }
      setSelectedAttributes(initialSelectedAttrs);

      setProduct(prod);
      setVariants(vList);
      setImages(iList);
      setVideos(prod.product_videos ?? []);
      setCategory(prod.categories ?? null);
      setBrand(prod.brands ?? null);
      setSelected(first);
      setSizeGuide(payload?.size_guide ?? null);
      setBundles(payload?.bundles ?? []);

      setMainImage(
        iList.find((i: any) => i.is_primary)?.url ??
        iList[0]?.url ??
        null
      );

      // Add to recent store
      const basePrice = first?.price_syp ?? prod.base_price ?? 0;
      addRecent({
        id: prod.id,
        slug: prod.slug,
        nameAr: prod.name_ar,
        nameEn: prod.name_en,
        priceSyp: basePrice,
        imageUrl: iList.find((image: any) => image.is_primary)?.url ?? iList[0]?.url ?? null,
        brandName: prod.brands?.name
      });

      setLoading(false);
    })();

    return () => { alive = false; };
  }, [slug]);

  const attributeTypes = useMemo(() => {
    const typesMap = new Map<string, { typeSlug?: string, typeEn: string, values: any[] }>();
    variants.forEach(v => {
      v.dynamicAttrs?.forEach((attr: any) => {
        const typeAr = attr.typeAr || '';
        const typeEn = attr.typeEn || '';
        const typeSlug = attr.typeSlug || '';
        const key = typeAr;
        if (!typesMap.has(key)) {
          typesMap.set(key, { typeSlug, typeEn, values: [] });
        }
        const valuesList = typesMap.get(key)!.values;
        if (!valuesList.find((val: any) => val.valueAr === attr.valueAr)) {
          valuesList.push(attr);
        }
      });
    });

    const list = Array.from(typesMap.entries()).map(([typeAr, data]) => {
      // Sort values inside this attribute type
      const sortedValues = [...data.values].sort((a, b) => {
        // If numeric sizes (e.g. 38, 39, 40, 41 EU)
        const numA = parseFloat(a.valueAr.replace(/[^0-9.]/g, ''));
        const numB = parseFloat(b.valueAr.replace(/[^0-9.]/g, ''));
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          return numA - numB;
        }
        // Standard clothing size order
        const sizeOrder: Record<string, number> = {
          'xs': 1, 's': 2, 'm': 3, 'l': 4, 'xl': 5, 'xxl': 6, '2xl': 6, 'xxxl': 7, '3xl': 7,
          'مقاس موحد': 99, 'one size': 99
        };
        const sA = sizeOrder[a.valueAr.toLowerCase()] ?? sizeOrder[a.valueEn?.toLowerCase()] ?? 50;
        const sB = sizeOrder[b.valueAr.toLowerCase()] ?? sizeOrder[b.valueEn?.toLowerCase()] ?? 50;
        if (sA !== sB) return sA - sB;

        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

      return {
        typeAr,
        typeSlug: data.typeSlug,
        typeEn: data.typeEn,
        values: sortedValues,
      };
    });

    // Sort attribute types canonically (Color -> Size -> Material)
    list.sort((a, b) => {
      const pA = getAttrPriority(a.typeAr, a.typeEn, a.typeSlug);
      const pB = getAttrPriority(b.typeAr, b.typeEn, b.typeSlug);
      if (pA !== pB) return pA - pB;
      return a.typeAr.localeCompare(b.typeAr);
    });

    return list;
  }, [variants]);

  const handleSelectAttribute = (typeAr: string, valueAr: string) => {
    // 1. Calculate the prospective target attributes
    const targetAttrs = { ...selectedAttributes, [typeAr]: valueAr };

    // 2. Try exact match first
    const requiredKeys = attributeTypes.map(t => t.typeAr);
    let matchedVariant = variants.find(v => {
      return requiredKeys.every(k => {
        const val = targetAttrs[k];
        if (!val) return true;
        return v.dynamicAttrs?.some((a: any) => a.typeAr === k && a.valueAr === val);
      });
    });

    // 3. If no exact match (e.g. changing size to EU 44 when current color isn't made in EU 44),
    // find the first available variant that has this chosen attribute!
    if (!matchedVariant) {
      matchedVariant = variants.find(v => {
        return v.dynamicAttrs?.some((a: any) => a.typeAr === typeAr && a.valueAr === valueAr);
      });
    }

    // 4. Update selected and synchronize selectedAttributes to that variant
    if (matchedVariant) {
      const newSelectedAttrs: Record<string, string> = {};
      matchedVariant.dynamicAttrs?.forEach((attr: any) => {
        newSelectedAttrs[attr.typeAr] = attr.valueAr;
      });
      setSelectedAttributes(newSelectedAttrs);
      setSelected(matchedVariant);
    } else {
      setSelectedAttributes(targetAttrs);
    }
  };

  const getOptionAvailability = (typeAr: string, valueAr: string) => {
    // 1. Find all variants that possess this candidate value for this attribute type
    const candidateVariants = variants.filter((v: any) =>
      v.dynamicAttrs?.some((a: any) => a.typeAr === typeAr && a.valueAr === valueAr)
    );

    if (candidateVariants.length === 0) {
      return { isAvailable: false, reason: 'notFound' as const };
    }

    // 2. All other attribute types that currently have a selection
    const otherSelectedTypes = attributeTypes
      .map(t => t.typeAr)
      .filter(tKey => tKey !== typeAr && selectedAttributes[tKey]);

    // 3. Find if any candidate variant matches ALL other currently selected attributes
    const matchingVariants = candidateVariants.filter((v: any) => {
      return otherSelectedTypes.every((otherKey) => {
        const selectedVal = selectedAttributes[otherKey];
        return v.dynamicAttrs?.some((a: any) => a.typeAr === otherKey && a.valueAr === selectedVal);
      });
    });

    if (matchingVariants.length === 0) {
      // Incompatible with current combination (e.g. this size or material is not available for the selected color)
      return { isAvailable: false, reason: 'incompatible' as const };
    }

    // 4. Check if any compatible variant has stock > 0
    const inStock = matchingVariants.some((v: any) => Number(v.stock_quantity ?? 0) > 0);

    if (!inStock) {
      return { isAvailable: false, reason: 'outOfStock' as const };
    }

    return { isAvailable: true, reason: 'available' as const };
  };

  useEffect(() => {
    if (variants.length === 0 || attributeTypes.length === 0) return;
    const requiredAttributeKeys = attributeTypes.map(t => t.typeAr);
    const hasSelectedAll = requiredAttributeKeys.every(k => selectedAttributes[k]);
    
    if (hasSelectedAll) {
       const exactMatch = variants.find(v => {
         return requiredAttributeKeys.every(k => {
           return v.dynamicAttrs?.some((a: any) => a.typeAr === k && a.valueAr === selectedAttributes[k]);
         });
       });
       if (exactMatch && exactMatch.id !== selected?.id) {
         setSelected(exactMatch);
       }
    }
  }, [selectedAttributes, variants, attributeTypes, selected]);

  const totalStock = useMemo(
    () => variants.reduce((sum: number, v: any) => sum + Number(v.stock_quantity ?? 0), 0),
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
      itemType: 'variant',
      variantId: selected.id,
      productId: product.id,
      productSlug: product.slug,
      nameAr: product.name_ar,
      nameEn: product.name_en ?? '',
      sku: selected.sku,
      priceSyp: selected.price_syp,
      comparePriceSyp: selected.compare_price_syp ?? null,
      imageUrl: mainImage,
      maxQuantity: Math.min(selectedStock, 99),
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
            {(images.length ? images : (mainImage ? [{ id: 'fallback', url: mainImage }] : [])).map((img: any, index: number) => (
              <button
                type="button"
                key={img.id}
                onClick={() => setMainImage(img.url)}
                aria-label={`${td('image')} ${index + 1}`}
                aria-pressed={mainImage === img.url}
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

          {videos.length > 0 && (
            <div className="space-y-3 pt-3">
              {videos.map((video: any) => (
                <video
                  key={video.id}
                  controls
                  preload="metadata"
                  poster={video.thumbnail_url ?? undefined}
                  className="aspect-video w-full rounded-lg border border-border bg-black object-contain"
                >
                  <source src={video.url} type="video/mp4" />
                </video>
              ))}
            </div>
          )}
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
                  <p className="mt-1 text-lg font-black text-[#1F1B16]">{variantTitle(selected, isAr, td)}</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Size Guide Button */}
                  {sizeGuide && (
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Ruler className="w-4 h-4" />
                      {isAr ? 'دليل المقاسات' : 'Size Guide'}
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-6 flex items-end gap-3">
                <div className="text-2xl font-black text-[#171411]">
                  <PriceDisplay amountSyp={selected.price_syp} className="!text-2xl" />
                </div>
                {selected.compare_price_syp && selected.compare_price_syp > selected.price_syp && (
                  <div className="text-sm text-[#9CA3AF] line-through">
                    <PriceDisplay amountSyp={selected.compare_price_syp} className="!text-sm" />
                  </div>
                )}
              </div>

              {/* Fixed, deterministic specs cards layout */}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selected.sku && (
                  <div className="rounded-2xl bg-background p-3 text-sm">
                    <p className="flex items-center gap-2 font-bold text-[#6F6658]"><Barcode className="h-4 w-4 text-primary" /> SKU</p>
                    <p className="mt-1 font-mono text-[#1F1B16]" dir="ltr">{selected.sku}</p>
                  </div>
                )}
                
                {selected.dynamicAttrs?.map((attr: any) => {
                  const isColor = !!attr.hex || attr.typeSlug === 'color' || attr.typeAr === 'اللون';
                  const isSize = attr.typeSlug === 'size' || attr.typeAr === 'المقاس';
                  const isMaterial = attr.typeSlug === 'material' || attr.typeAr === 'الخامة';

                  const IconComponent = isColor ? Palette : isSize ? Ruler : isMaterial ? Layers3 : Info;

                  return (
                    <div key={attr.typeAr} className="rounded-2xl bg-background p-3 text-sm">
                      <p className="flex items-center gap-2 font-bold text-[#6F6658]">
                        <IconComponent className="h-4 w-4 text-primary" /> 
                        {isAr ? attr.typeAr : (attr.typeEn || attr.typeAr)}
                      </p>
                      <p className="mt-1 font-black text-[#1F1B16] flex items-center gap-2">
                        {attr.hex && (
                          <span className="w-3 h-3 rounded-full border border-black/10 inline-block" style={{ backgroundColor: attr.hex }} />
                        )}
                        {isAr ? attr.valueAr : (attr.valueEn || attr.valueAr)}
                      </p>
                    </div>
                  );
                })}

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

              <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold w-fit mt-4 ${selectedState.cls}`}>
                <StockIcon className="h-5 w-5" />
                {selectedState.text}
              </div>

              {/* Notify Me if out of stock */}
              {selected && selected.stock_quantity <= 0 && (
                <div className="mt-4">
                  <NotifyMeForm variantId={selected.id} isAr={isAr} />
                </div>
              )}

              {/* Bundles */}
              {bundles.length > 0 && (
                <ProductBundlesList bundles={bundles} isAr={isAr} />
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-background-card p-6 text-center">
              <p className="font-bold text-[#6F6658]">{td('noVariants')}</p>
            </div>
          )}

          {attributeTypes.length > 0 && (
            <div className="space-y-6">
              {attributeTypes.map((attrType) => (
                <div key={attrType.typeAr} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-[#3C352C]">
                      {isAr ? attrType.typeAr : (attrType.typeEn || attrType.typeAr)}
                    </p>
                    {selectedAttributes[attrType.typeAr] && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {selectedAttributes[attrType.typeAr]}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 -mx-1" style={{ scrollbarWidth: 'none' }}>
                    {attrType.values.map((val) => {
                      const isSelected = selectedAttributes[attrType.typeAr] === val.valueAr;
                      const { isAvailable, reason } = getOptionAvailability(attrType.typeAr, val.valueAr);
                      const isColor = !!val.hex;
                      
                      const tooltip = !isAvailable
                        ? reason === 'incompatible'
                          ? (isAr ? `${val.valueAr} (غير متوفر مع الخيارات المحددة)` : `${val.valueEn || val.valueAr} (Unavailable with current selection)`)
                          : (isAr ? `${val.valueAr} (نفد من المخزون)` : `${val.valueEn || val.valueAr} (Out of stock)`)
                        : (isAr ? val.valueAr : (val.valueEn || val.valueAr));
                      
                      return (
                        <button
                          type="button"
                          key={val.valueAr}
                          onClick={() => isAvailable && handleSelectAttribute(attrType.typeAr, val.valueAr)}
                          disabled={!isAvailable}
                          className={[
                            'relative shrink-0 transition-all overflow-hidden flex items-center justify-center focus:outline-none select-none',
                            isColor ? 'w-11 h-11 rounded-full border' : 'px-5 py-2.5 rounded-xl border text-sm font-bold',
                            isSelected 
                              ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-sm' 
                              : isAvailable 
                                ? 'border-border hover:border-primary/60 bg-background-card text-[#1F1B16] hover:scale-[1.02] active:scale-[0.98]' 
                                : 'border-dashed border-red-200/80 bg-[#FAF7F2] text-[#9E9689] opacity-45 cursor-not-allowed',
                          ].join(' ')}
                          title={tooltip}
                        >
                          {isColor ? (
                            <span 
                              className={`absolute inset-1 rounded-full shadow-inner ${!isAvailable ? 'grayscale-[40%]' : ''}`} 
                              style={{ backgroundColor: val.hex }} 
                            />
                          ) : (
                            <span className={!isAvailable ? 'line-through decoration-red-500/70 decoration-[1.5px]' : ''}>
                              {isAr ? val.valueAr : (val.valueEn || val.valueAr)}
                            </span>
                          )}
                          {!isAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                              <div className="w-[140%] h-[2px] bg-red-600/85 -rotate-45 shadow-[0_0_2px_rgba(255,255,255,0.8)]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {variants.length > 0 && attributeTypes.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-black text-[#3C352C]">{td('chooseVariant')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {variants.map((v: any) => {
                  const qty = Number(v.stock_quantity ?? 0);
                  const active = selected?.id === v.id;
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => setSelected(v)}
                      className={[
                        'rounded-2xl border p-3 text-right transition-all',
                        active
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-background-card hover:border-primary/60',
                      ].join(' ')}
                    >
                      <div className="mt-2 flex flex-wrap gap-1 text-[11px] justify-end">
                        {v.sku && <span className="rounded-full bg-background px-2 py-1" dir="ltr">{v.sku}</span>}
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-[#1F1B16]">{variantTitle(v, isAr, td)}</span>
                        <PriceDisplay amountSyp={v.price_syp} className="!text-sm" />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
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
                type="button"
                onClick={handleAddToCart}
                className={[
                  'flex-1 rounded-2xl py-4 text-base font-black transition-all',
                  added ? 'bg-green-600 text-text-primary' : 'bg-primary text-text-primary hover:bg-[#D8B95F] active:scale-[0.98]',
                ].join(' ')}
              >
                {added ? td('addedToCart') : td('addToCart')}
              </button>
            ) : (
              <button type="button" disabled className="flex-1 rounded-2xl bg-[#E8DCC3] py-4 text-base font-black text-[#9CA3AF]">
                {selected ? td('outOfStockLong') : td('chooseVariantFirst')}
              </button>
            )}
            {product?.id && (
              <>
                <div className="rounded-2xl border border-border bg-background-card p-2">
                  <WishlistButton productId={product.id} />
                </div>
                <ProductSharing title={isAr ? product.name_ar : product.name_en} />
              </>
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

      {product?.id && category?.id && (
        <div className="mt-4">
          <SimilarProducts productSlug={product.slug} />
        </div>
      )}

      {/* Recently Viewed Products */}
      <RecentlyViewed />
      {/* Size Guide Modal */}
      {sizeGuide && showSizeGuide && (
        <SizeGuideModal
          onClose={() => setShowSizeGuide(false)}
          guide={sizeGuide}
          isAr={isAr}
        />
      )}
    </main>
  );
}
