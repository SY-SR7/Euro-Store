// @ts-nocheck
/* eslint-disable */
'use client';

import Link from 'next/link';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { Package, Layers3, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

function formatSYP(n: number) {
  return Number(n || 0).toLocaleString('ar-SY') + ' ل.س';
}

function stockBadge(stock?: number | null) {
  if (stock == null) return null;

  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700">
        <XCircle className="h-3 w-3" /> نفذ
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
        <AlertTriangle className="h-3 w-3" /> {stock} فقط
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
      <CheckCircle2 className="h-3 w-3" /> متوفر
    </span>
  );
}

export function ProductCard({ product, minPrice, variantCount, totalStock }: any) {
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
        <ImageWithFallback
          src={product.image_url || product.image || product.thumbnail_url}
          alt={product.name_ar || product.name_en || 'product'}
          kind="product"
          label="صورة المنتج"
          sublabel={product.name_ar || product.name_en}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {product.is_featured && (
          <span className="absolute right-2 top-2 rounded-full bg-[#C9A84C] px-2 py-0.5 text-[10px] font-black text-white shadow">
            مميز ⭐
          </span>
        )}

        <div className="absolute bottom-2 right-2 flex flex-wrap gap-1">
          {stockBadge(stock)}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="line-clamp-2 font-black leading-tight text-[#1F1B16]">
            {product.name_ar}
          </p>
          {product.name_en && (
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
                {variants} متغير
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7EF] px-2 py-1 font-bold">
              <Package className="h-3 w-3 text-[#C9A84C]" />
              التفاصيل
            </span>
          </div>

          {minPrice != null && Number(minPrice) > 0 ? (
            <p className="text-base font-black text-[#C9A84C]">
              يبدأ من {formatSYP(minPrice)}
            </p>
          ) : (
            <p className="text-sm font-bold text-[#A8A29E]">
              السعر داخل التفاصيل
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}