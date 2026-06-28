'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Database } from '@eurostore/database';
import { formatSYP } from '@eurostore/shared';

type Tables = Database['public']['Tables'];

export type CatalogProduct = Pick<
  Tables['products']['Row'],
  'id' | 'name_ar' | 'name_en' | 'slug' | 'description_ar' | 'category_id' | 'brand_id' | 'is_featured'
>;

export type CatalogVariant = Pick<
  Tables['product_variants']['Row'],
  'id' | 'product_id' | 'sku' | 'price_syp' | 'compare_price_syp' | 'stock_quantity'
>;

export type CatalogCategory = Pick<Tables['categories']['Row'], 'id' | 'name_ar' | 'name_en' | 'slug'>;
export type CatalogBrand    = Pick<Tables['brands']['Row'], 'id' | 'name' | 'slug'>;

export interface ProductPriceSummary {
  priceLabel: string;
  comparePriceLabel: string | null;
  stockLabel: string;
  totalStock: number;
}

export function variantsForProduct(productId: string, variants: CatalogVariant[]): CatalogVariant[] {
  return variants.filter((v) => v.product_id === productId);
}

export function summarizeProductVariants(variants: CatalogVariant[]): ProductPriceSummary {
  const prices = variants.map((v) => v.price_syp);
  const comparePrices = variants
    .map((v) => v.compare_price_syp)
    .filter((p): p is number => typeof p === 'number');
  const totalStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);

  if (prices.length === 0) {
    return {
      priceLabel: '—',
      comparePriceLabel: null,
      stockLabel: '—',
      totalStock,
    };
  }

  const minPrice = Math.min(...prices);
  const maxCompare = comparePrices.length > 0 ? Math.max(...comparePrices) : null;

  return {
    priceLabel: formatSYP(minPrice),
    comparePriceLabel: maxCompare !== null && maxCompare > minPrice ? formatSYP(maxCompare) : null,
    stockLabel: String(totalStock),
    totalStock,
  };
}

export function createCatalogLookup<Row extends { id: string }>(rows: Row[]): Map<string, Row> {
  return new Map(rows.map((r) => [r.id, r]));
}

interface ProductCardProps {
  product: CatalogProduct;
  variants: CatalogVariant[];
  category?: CatalogCategory;
  brand?: CatalogBrand;
}

export function ProductCard({ product, variants, category, brand }: ProductCardProps): JSX.Element {
  const t = useTranslations('catalog');
  const summary = summarizeProductVariants(variantsForProduct(product.id, variants));

  // Build translated labels
  const priceLabel = summary.totalStock === 0 && summary.priceLabel === '—'
    ? t('priceSoon')
    : summary.priceLabel;

  const stockLabel = (() => {
    if (summary.priceLabel === '—') return t('stockUpdate');
    if (summary.totalStock > 0) return t('inStock', { count: summary.totalStock });
    return t('outOfStock');
  })();

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col rounded-md border border-[#2E2E2E] bg-[#151515] p-4 transition hover:border-[#C9A84C] hover:bg-[#1C1C1C]"
    >
      <div className="flex aspect-[4/5] items-center justify-center rounded-md border border-[#2E2E2E] bg-[#202020] p-6 text-center">
        <span className="text-2xl font-semibold leading-snug text-[#C9A84C]">{product.name_ar}</span>
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between gap-3 text-xs text-[#9CA3AF]">
          <span>{category?.name_ar ?? 'EuroStore'}</span>
          <span>{brand?.name ?? t('uncategorized')}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-[#F4F1E8] transition group-hover:text-[#C9A84C]">
          {product.name_ar}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#9CA3AF]">{product.description_ar}</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[#C9A84C]">{priceLabel}</p>
            {summary.comparePriceLabel ? (
              <p className="text-sm text-[#6B7280] line-through">{summary.comparePriceLabel}</p>
            ) : null}
          </div>
          <span className="rounded-sm border border-[#2E2E2E] px-2 py-1 text-xs text-[#B8B8B8]">{stockLabel}</span>
        </div>
      </div>
    </Link>
  );
}
