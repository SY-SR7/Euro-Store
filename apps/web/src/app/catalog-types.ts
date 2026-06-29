import { formatSYP } from '@eurostore/shared';

export interface CatalogProductImage {
  id?: string;
  product_id?: string;
  url?: string | null;
  image_url?: string | null;
  src?: string | null;
  path?: string | null;
  alt_text?: string | null;
  is_primary?: boolean | null;
  sort_order?: number | null;
}

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
  images?: string[] | string | null;

  product_images?: CatalogProductImage[] | CatalogProductImage | null;
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

export function productImageUrl(product: CatalogProduct): string | null {
  const direct =
    product.image_url ||
    product.thumbnail_url ||
    product.primary_image_url ||
    product.main_image_url ||
    product.cover_image_url;

  if (direct && typeof direct === 'string') return direct;

  if (Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string') {
    return product.images[0];
  }

  if (typeof product.images === 'string' && product.images.trim()) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
    } catch {
      return product.images;
    }
  }

  const imageRows = Array.isArray(product.product_images)
    ? product.product_images
    : product.product_images
      ? [product.product_images]
      : [];

  const sorted = [...imageRows].sort((a, b) => {
    const primaryScore = Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary));
    if (primaryScore !== 0) return primaryScore;

    return Number(a.sort_order ?? 9999) - Number(b.sort_order ?? 9999);
  });

  const first = sorted[0];

  return first?.url || first?.image_url || first?.src || first?.path || null;
}