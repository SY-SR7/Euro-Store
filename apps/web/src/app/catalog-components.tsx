// @ts-nocheck
/* eslint-disable */
'use client';
import Link from 'next/link';

function formatSYP(n: number) {
  return n.toLocaleString('ar-SY') + ' ل.س';
}

interface Product {
  id: string; name_ar: string; name_en?: string; slug: string;
  description_ar?: string; category_id?: string|null; brand_id?: string|null;
  is_featured?: boolean; is_active?: boolean; image_url?: string|null;
}

interface ProductCardProps { product: Product; minPrice?: number; }

export function ProductCard({ product, minPrice }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8DCC3] bg-white shadow-sm hover:shadow-md hover:border-[#C9A84C]/40 transition-all duration-200">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F3EDE3]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_ar}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#C9A84C]/20 text-4xl">◈</div>
        )}
        {product.is_featured && (
          <span className="absolute top-2 right-2 rounded-full bg-[#C9A84C] px-2 py-0.5 text-[10px] font-black text-white">مميز ⭐</span>
        )}
      </div>
      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="font-bold text-[#1F1B16] leading-tight line-clamp-2">{product.name_ar}</p>
        {product.name_en && <p className="text-xs text-[#A8A29E]" dir="ltr">{product.name_en}</p>}
        <div className="mt-auto pt-2">
          {minPrice != null && minPrice > 0 ? (
            <p className="text-base font-black text-[#C9A84C]">{formatSYP(minPrice)}</p>
          ) : (
            <p className="text-sm text-[#A8A29E]">اطلع على التفاصيل</p>
          )}
        </div>
      </div>
    </Link>
  );
}