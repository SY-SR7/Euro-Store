'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export interface CatalogProduct { id: string; name_ar: string; name_en: string; slug: string; description_ar?: string | null; category_id?: string | null; brand_id?: string | null; is_featured?: boolean | null; }
export interface CatalogVariant  { id: string; product_id: string; sku: string; price_syp: number | null; compare_price_syp: number | null; stock_quantity: number; }
export interface CatalogCategory { id: string; name_ar: string; name_en: string; slug: string; }
export interface CatalogBrand    { id: string; name: string; slug: string; }

export function createCatalogLookup<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((i) => [i.id, i]));
}

interface ProductCardProps { product: CatalogProduct; variants: CatalogVariant[]; category?: CatalogCategory; brand?: CatalogBrand; }

export function ProductCard({ product, variants, brand }: ProductCardProps) {
  const t = useTranslations('catalog');
  const productVariants = variants.filter((v) => v.product_id === product.id);
  const minPrice = productVariants.length > 0 ? Math.min(...productVariants.filter((v) => v.price_syp !== null).map((v) => v.price_syp as number)) : null;
  const totalStock = productVariants.reduce((s, v) => s + v.stock_quantity, 0);
  const hasDiscount = productVariants.some((v) => v.compare_price_syp !== null && v.compare_price_syp > (v.price_syp ?? 0));

  const priceLabel = minPrice !== null ? `${minPrice.toLocaleString()} ${t('../../common.currency', { defaultValue: 'ل.س' })}` : t('priceSoon');
  const stockLabel = productVariants.length === 0
    ? t('stockUpdate')
    : totalStock > 0
    ? t('inStock', { count: totalStock })
    : t('outOfStock');

  return (
    <div className="relative group rounded-md border border-[#2E2E2E] bg-[#151515] overflow-hidden transition hover:border-[#C9A84C]">
      <div className="aspect-[3/4] bg-[#1C1C1C] flex items-center justify-center text-[#6B7280] text-xs">
        {t('noImage')}
      </div>
      <div className="absolute top-3 start-3 flex flex-col gap-1">
        {product.is_featured && (
          <span className="rounded-sm bg-[#C9A84C] px-2 py-0.5 text-[10px] font-semibold text-[#111]">{t('newBadge')}</span>
        )}
        {hasDiscount && (
          <span className="rounded-sm bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">{t('discount')}</span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] text-[#9CA3AF] mb-1">{brand?.name ?? t('uncategorized')}</p>
        <p className="text-sm font-medium text-[#E2E2E2] leading-snug">{product.name_ar}</p>
        <p className="text-xs text-[#9CA3AF] leading-snug mt-0.5">{product.name_en}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#C9A84C]">{priceLabel}</span>
          <span className="text-xs text-[#6B7280]">{stockLabel}</span>
        </div>
      </div>
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-0" aria-label={`${t('featured')} ${product.name_ar}`} />
    </div>
  );
}
