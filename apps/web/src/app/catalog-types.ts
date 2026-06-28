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
