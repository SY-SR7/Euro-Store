import { formatSYP } from '@eurostore/shared';

export interface CatalogProduct {
  id: string;
  name_ar: string;
  name_en?: string | null;
  slug: string;
  description_ar?: string | null;
  description_en?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  is_featured?: boolean | null;
  is_active?: boolean | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  primary_image_url?: string | null;
  main_image_url?: string | null;
  cover_image_url?: string | null;
}

export interface CatalogVariant {
  id: string;
  product_id: string;
  sku?: string | null;
  price_syp: number;
  compare_price_syp?: number | null;
  stock_quantity: number;
  is_active?: boolean | null;
}

export interface CatalogCategory {
  id: string;
  name_ar: string;
  name_en?: string | null;
  slug: string;
  sort_order?: number | null;
  is_active?: boolean | null;
}

export interface CatalogBrand {
  id: string;
  name: string;
  slug?: string | null;
  is_active?: boolean | null;
}

export function variantsForProduct(productId: string, variants: CatalogVariant[]): CatalogVariant[] {
  return variants.filter((v) => v.product_id === productId);
}

export function summarizeProductVariants(variants: CatalogVariant[]) {
  const activeVariants = variants.filter((v) => v.is_active !== false);

  const prices = activeVariants
    .map((v) => Number(v.price_syp))
    .filter((value) => Number.isFinite(value));

  const comparePrices = activeVariants
    .map((v) => v.compare_price_syp)
    .filter((p): p is number => typeof p === 'number' && Number.isFinite(p));

  const totalStock = activeVariants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);

  if (prices.length === 0) {
    return {
      priceLabel: '—',
      comparePriceLabel: null,
      totalStock,
    };
  }

  const minPrice = Math.min(...prices);
  const maxCompare = comparePrices.length > 0 ? Math.max(...comparePrices) : null;

  return {
    priceLabel: formatSYP(minPrice),
    comparePriceLabel: maxCompare !== null && maxCompare > minPrice ? formatSYP(maxCompare) : null,
    totalStock,
  };
}

export function createCatalogLookup<Row extends { id: string }>(rows: Row[]): Map<string, Row> {
  return new Map(rows.map((r) => [r.id, r]));
}

export function productImageUrl(product: CatalogProduct): string | null {
  return (
    product.image_url ||
    product.thumbnail_url ||
    product.primary_image_url ||
    product.main_image_url ||
    product.cover_image_url ||
    null
  );
}