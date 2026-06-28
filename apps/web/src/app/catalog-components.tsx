import Link from 'next/link';
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
export type CatalogBrand = Pick<Tables['brands']['Row'], 'id' | 'name' | 'slug'>;

export interface ProductPriceSummary {
  priceLabel: string;
  comparePriceLabel: string | null;
  stockLabel: string;
  totalStock: number;
}

export function variantsForProduct(productId: string, variants: CatalogVariant[]): CatalogVariant[] {
  return variants.filter((variant) => variant.product_id === productId);
}

export function summarizeProductVariants(variants: CatalogVariant[]): ProductPriceSummary {
  const prices = variants.map((variant) => variant.price_syp);
  const comparePrices = variants
    .map((variant) => variant.compare_price_syp)
    .filter((price): price is number => typeof price === 'number');
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock_quantity, 0);

  if (prices.length === 0) {
    return {
      priceLabel: 'السعر قريباً',
      comparePriceLabel: null,
      stockLabel: 'سيتم تحديث التوفر قريباً',
      totalStock,
    };
  }

  const minPrice = Math.min(...prices);
  const maxComparePrice = comparePrices.length > 0 ? Math.max(...comparePrices) : null;

  return {
    priceLabel: formatSYP(minPrice),
    comparePriceLabel: maxComparePrice !== null && maxComparePrice > minPrice ? formatSYP(maxComparePrice) : null,
    stockLabel: totalStock > 0 ? `${totalStock} قطعة متاحة` : 'غير متوفر حالياً',
    totalStock,
  };
}

export function createCatalogLookup<Row extends { id: string }>(rows: Row[]): Map<string, Row> {
  return new Map(rows.map((row) => [row.id, row]));
}

interface ProductCardProps {
  product: CatalogProduct;
  variants: CatalogVariant[];
  category?: CatalogCategory;
  brand?: CatalogBrand;
}

export function ProductCard({ product, variants, category, brand }: ProductCardProps): JSX.Element {
  const summary = summarizeProductVariants(variantsForProduct(product.id, variants));

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
          <span>{brand?.name ?? 'منتقى'}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-[#F4F1E8] transition group-hover:text-[#C9A84C]">
          {product.name_ar}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#9CA3AF]">{product.description_ar}</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[#C9A84C]">{summary.priceLabel}</p>
            {summary.comparePriceLabel ? (
              <p className="text-sm text-[#6B7280] line-through">{summary.comparePriceLabel}</p>
            ) : null}
          </div>
          <span className="rounded-sm border border-[#2E2E2E] px-2 py-1 text-xs text-[#B8B8B8]">{summary.stockLabel}</span>
        </div>
      </div>
    </Link>
  );
}
