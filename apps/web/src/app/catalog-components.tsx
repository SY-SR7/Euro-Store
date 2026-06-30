// @ts-nocheck
/* eslint-disable */
'use client';

import Link from 'next/link';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { Package, Layers3, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { useLocale, useTranslations } from 'next-intl';

function formatSYP(n: number, isAr: boolean, t: any) {
  return Number(n || 0).toLocaleString(isAr ? 'ar-SY' : 'en-US') + ' ' + t('syp', { fallback: 'ل.س' });
}

function stockBadge(stock: number | null | undefined, t: any) {
  if (stock == null) return null;

  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700">
        <XCircle className="h-3 w-3" /> {t('outOfStock', { fallback: 'نفذ' })}
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
        <AlertTriangle className="h-3 w-3" /> {stock} {t('only', { fallback: 'فقط' })}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
      <CheckCircle2 className="h-3 w-3" /> {t('inStock', { fallback: 'متوفر' })}
    </span>
  );
}

export function ProductCard({ product, minPrice, variantCount, totalStock }: any) {
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

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-[#E8DCC3] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A84C]/60 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F3EDE3]">
        <div className="absolute left-2 top-2 z-10">
          <WishlistButton productId={product.id} size="sm" />
        </div>
        <div className="absolute left-2 top-2 z-10">
          <WishlistButton productId={product.id} size="sm" />
        </div>
        <ImageWithFallback
          src={product.image_url || product.image || product.thumbnail_url}
          alt={productName || 'product'}
          kind="product"
          label={t('productImage', { fallback: 'صورة المنتج' })}
          sublabel={productName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {product.is_featured && (
          <span className="absolute right-2 top-2 rounded-full bg-[#C9A84C] px-2 py-0.5 text-[10px] font-black text-white shadow">
            {t('featured', { fallback: 'مميز ⭐' })}
          </span>
        )}

        <div className="absolute bottom-2 right-2 flex flex-wrap gap-1">
          {stockBadge(stock, t)}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="line-clamp-2 font-black leading-tight text-[#1F1B16]">
            {productName}
          </p>
          {(!isAr && product.name_ar) && (
            <p className="mt-0.5 line-clamp-1 text-xs text-[#A8A29E]" dir="rtl">
              {product.name_ar}
            </p>
          )}
          {(isAr && product.name_en) && (
            <p className="mt-0.5 line-clamp-1 text-xs text-[#A8A29E]" dir="ltr">
              {product.name_en}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6F6658]">
            {variants != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7EF] px-2 py-1 font-bold">
                <Layers3 className="h-3 w-3 text-[#C9A84C]" />
                {variants} {t('variant', { fallback: 'متغير' })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7EF] px-2 py-1 font-bold">
              <Package className="h-3 w-3 text-[#C9A84C]" />
              {t('details', { fallback: 'التفاصيل' })}
            </span>
          </div>

          {minPrice != null && Number(minPrice) > 0 ? (
            <p className="text-base font-black text-[#C9A84C]">
              {t('startsFrom', { fallback: 'يبدأ من' })} {formatSYP(minPrice, isAr, t)}
            </p>
          ) : (
            <p className="text-sm font-bold text-[#A8A29E]">
              {t('priceInDetails', { fallback: 'السعر داخل التفاصيل' })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}