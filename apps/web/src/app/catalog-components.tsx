import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogVariant,
  summarizeProductVariants,
  variantsForProduct,
} from '@/app/catalog-types';

// Re-exported for backward compatibility with existing imports across the app ”
// the actual definitions now live in catalog-types.ts (no 'use client'), since
// they are plain types/functions that Server Components also need to call
// directly. Importing a non-component value from a 'use client' module into a
// Server Component is unreliable in the Next.js App Router; keeping the pure
// logic in a server-safe module and only marking the actual component
// ('ProductCard', which uses the useTranslations hook) as client-only fixes
// "createCatalogLookup is not a function" style runtime errors.
export {
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogVariant,
  type ProductPriceSummary,
  createCatalogLookup,
  summarizeProductVariants,
  variantsForProduct,
} from '@/app/catalog-types';

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
  const priceLabel = summary.totalStock === 0 && summary.priceLabel === '”'
    ? t('priceSoon')
    : summary.priceLabel;

  const stockLabel = (() => {
    if (summary.priceLabel === '”') return t('stockUpdate');
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

