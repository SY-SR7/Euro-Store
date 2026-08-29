/* eslint-disable */
'use client';

import Link from 'next/link';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { Package, Layers3, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { useLocale, useTranslations } from 'next-intl';
import { PriceDisplay } from '@/components/common/PriceDisplay';

function stockBadge(stock: number | null | undefined, t: any) {
  if (stock == null) return null;

  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700">
        <XCircle className="h-3 w-3" /> {t('outOfStock')}
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
        <AlertTriangle className="h-3 w-3" /> {stock} {t('only')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
      <CheckCircle2 className="h-3 w-3" /> {t('inStock')}
    </span>
  );
}

export function ProductCard({ product, minPrice, variantCount, totalStock, varyingAttributes }: any) {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const isAr = locale === 'ar';
  const productName = isAr ? product.name_ar : (product.name_en || product.name_ar);

  const variants =
    variantCount ??
    product?.variant_count ??
    product?.variants_count ??
    product?.variants?.length ??
    null;

  const stock =
    totalStock ??
    product?.total_stock ??
    product?.stock_quantity ??
    product?.stock ??
    null;

  let dynamicVariantsText = null;
  let varyingAttrsNames: string[] = [];

  if (varyingAttributes && Array.isArray(varyingAttributes)) {
    varyingAttrsNames = varyingAttributes.map((attr: any) => isAr ? attr.name_ar : (attr.name_en || attr.name_ar));
  } else if (product?.product_variants && Array.isArray(product.product_variants)) {
    const attrValuesMap = new Map<string, Set<string>>();
    
    product.product_variants.forEach((v: any) => {
      if (v.variant_attributes && Array.isArray(v.variant_attributes)) {
        v.variant_attributes.forEach((va: any) => {
          const attrTypeAr = va.attribute_values?.attribute_types?.name_ar;
          const attrTypeEn = va.attribute_values?.attribute_types?.name_en;
          const valId = va.attribute_values?.id;
          
          if (attrTypeAr && valId) {
            const attrName = isAr ? attrTypeAr : (attrTypeEn || attrTypeAr);
            if (!attrValuesMap.has(attrName)) {
              attrValuesMap.set(attrName, new Set());
            }
            attrValuesMap.get(attrName)!.add(valId);
          }
        });
      }
    });

    attrValuesMap.forEach((values, name) => {
      if (values.size > 1) {
        varyingAttrsNames.push(name.toLowerCase());
      }
    });
  }

  if (varyingAttrsNames.length > 0) {
    if (varyingAttrsNames.length === 1) {
      dynamicVariantsText = isAr 
        ? `يتوفر بأكثر من ${varyingAttrsNames[0]}` 
        : `Available in multiple ${varyingAttrsNames[0]}s`;
    } else if (varyingAttrsNames.length === 2) {
      dynamicVariantsText = isAr 
        ? `يتوفر بأكثر من ${varyingAttrsNames[0]} و${varyingAttrsNames[1]}` 
        : `Available in multiple ${varyingAttrsNames[0]}s and ${varyingAttrsNames[1]}s`;
    } else {
      const last = varyingAttrsNames.pop();
      dynamicVariantsText = isAr 
        ? `يتوفر بأكثر من ${varyingAttrsNames.join('، ')} و${last}` 
        : `Available in multiple ${varyingAttrsNames.join(', ')} and ${last}s`;
    }
  }

  const discountPercentage = product?.discount_percentage ?? (product?.discount != null ? Number(product.discount) : null);
  const comparePrice = product?.compare_price_syp ?? product?.comparePrice;
  const rawPrice = minPrice != null ? Number(minPrice) : (product?.base_price != null ? Number(product.base_price) : 0);
  
  let originalPrice = comparePrice;
  let finalDiscount = discountPercentage;
  if (discountPercentage && discountPercentage > 0 && !comparePrice && rawPrice > 0) {
    originalPrice = Math.round(rawPrice / (1 - discountPercentage / 100));
  } else if (comparePrice && comparePrice > rawPrice && !discountPercentage && rawPrice > 0) {
    finalDiscount = Math.round(((comparePrice - rawPrice) / comparePrice) * 100);
  }
  const hasDiscount = Boolean((finalDiscount && finalDiscount > 0) || (originalPrice && originalPrice > rawPrice));

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background-card transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={productName} />

      <div className="relative aspect-square w-full overflow-hidden bg-white p-4">
        <ImageWithFallback
          src={product.image_url || product.image || product.thumbnail_url}
          alt={productName || 'product'}
          fill
          className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Wishlist Button */}
        <div className="absolute left-2 top-2 z-50">
          <WishlistButton productId={product.id} size="sm" />
        </div>

        {/* Discount Badge on Image */}
        {hasDiscount && finalDiscount && (
          <span className="absolute start-2 bottom-2 z-20 rounded-lg bg-amber-500 text-amber-950 border border-amber-300 px-2 py-0.5 text-xs font-black shadow-md flex items-center gap-0.5">
            <span>-{finalDiscount}%</span>
          </span>
        )}

        <div className="absolute right-2 top-2 flex flex-col gap-1.5 z-20 items-end">
          {product.is_featured && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-text-primary shadow">
              {t('featured')}
            </span>
          )}
          {product.is_new && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-text-primary shadow border border-border">
              {t('new')}
            </span>
          )}
          {product.is_on_sale && !hasDiscount && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-amber-950 shadow">
              {t('sale')}
            </span>
          )}
        </div>

        <div className="absolute bottom-2 end-2 flex flex-wrap gap-1 z-20">
          {stockBadge(stock, t)}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="line-clamp-2 font-black leading-tight text-text-primary">
            {productName}
          </p>
          {(!isAr && product.name_ar) && (
            <p className="mt-0.5 line-clamp-1 text-xs text-text-muted" dir="rtl">
              {product.name_ar}
            </p>
          )}
          {(isAr && product.name_en) && (
            <p className="mt-0.5 line-clamp-1 text-xs text-text-muted" dir="ltr">
              {product.name_en}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
            {(dynamicVariantsText || (variants != null && variants > 1)) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 font-bold">
                <Layers3 className="h-3 w-3 text-primary" />
                {dynamicVariantsText ? dynamicVariantsText : `${variants} ${t('variant')}`}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 font-bold">
              <Package className="h-3 w-3 text-primary" />
              {t('details')}
            </span>
          </div>

          {rawPrice > 0 ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-text-muted text-xs font-bold shrink-0">{t('startsFrom')}</span>
              <PriceDisplay
                amountSyp={rawPrice}
                originalPriceSyp={originalPrice}
                discountPercentage={finalDiscount}
                className="!text-sm"
              />
            </div>
          ) : (
            <p className="text-sm font-bold text-text-muted">
              {t('priceInDetails')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
