// @ts-nocheck
/* eslint-disable */
'use client';

import Link from 'next/link';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { Package, Layers3, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { useLocale, useTranslations } from 'next-intl';

function formatSYP(n: number, isAr: boolean, t: any) {
  return Number(n || 0).toLocaleString(isAr ? 'ar-SY' : 'en-US') + ' ' + t('syp');
}

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

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background-card transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={productName} />

      <div className="relative aspect-[4/5] w-full overflow-hidden bg-background-secondary">
        <ImageWithFallback
          src={product.image_url || product.image || product.thumbnail_url}
          alt={productName || 'product'}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        <div className="absolute left-2 top-2 z-50">
          <WishlistButton productId={product.id} size="sm" />
        </div>

        {product.is_featured && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-text-primary shadow">
            {t('featured')}
          </span>
        )}

        <div className="absolute bottom-2 right-2 flex flex-wrap gap-1">
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

          {minPrice != null && Number(minPrice) > 0 ? (
            <p className="text-base font-black text-primary">
              {t('startsFrom')} {formatSYP(minPrice, isAr, t)}
            </p>
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