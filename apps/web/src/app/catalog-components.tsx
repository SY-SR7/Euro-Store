// @ts-nocheck
'use client';
import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string; name_ar: string; name_en?: string|null; slug: string;
    image_url?: string|null; is_featured?: boolean; category_id?: string|null;
  };
  minPrice?: number;
}

export function ProductCard({ product, minPrice }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group block rounded-2xl border border-[#E8DCC3] bg-white overflow-hidden hover:shadow-lg hover:border-[#C9A84C]/40 transition-all duration-200">
      <div className="aspect-square overflow-hidden bg-[#F3EDE3] relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name_ar} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl text-[#C9A84C]/20">◈</span>
          </div>
        )}
        {product.is_featured && (
          <span className="absolute top-2 right-2 rounded-full bg-[#C9A84C] px-2 py-0.5 text-xs font-bold text-white">مميز</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[#1F1B16] leading-tight group-hover:text-[#C9A84C] transition-colors">{product.name_ar}</h3>
        {product.name_en && <p className="mt-0.5 text-xs text-[#A8A29E]" dir="ltr">{product.name_en}</p>}
        {minPrice ? (
          <p className="mt-2 font-black text-[#C9A84C]">{minPrice.toLocaleString('ar-SY')} ل.س</p>
        ) : (
          <p className="mt-2 text-xs text-[#A8A29E]">السعر قريباً</p>
        )}
      </div>
    </Link>
  );
}

export function createCatalogLookup<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map(i => [i.id, i]));
}