'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import {
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogVariant,
  type ProductPriceSummary,
  createCatalogLookup,
  productImageUrl,
  summarizeProductVariants,
  variantsForProduct,
} from './catalog-types';

export {
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogVariant,
  type ProductPriceSummary,
  createCatalogLookup,
  summarizeProductVariants,
  variantsForProduct,
};

interface ProductCardProps {
  product: CatalogProduct;
  variants: CatalogVariant[];
  category?: CatalogCategory;
  brand?: CatalogBrand;
}

export function ProductCard({ product, variants, category, brand }: ProductCardProps): JSX.Element {
  const t = useTranslations('catalog');
  const summary = summarizeProductVariants(variantsForProduct(product.id, variants));
  const imageUrl = productImageUrl(product);

  const priceLabel =
    summary.totalStock === 0 && summary.priceLabel === '—'
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
      className="group block overflow-hidden rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-4 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-[#C9A84C] hover:shadow-2xl"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-[#E8DCC3] bg-[#F3EEE3]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name_ar}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-xl font-black text-[#C9A84C]">
            {product.name_ar}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#6F6658]">
        <span>{brand?.name ?? 'EuroStore'}</span>
        <span>{category?.name_ar ?? t('uncategorized')}</span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-xl font-black text-[#1F1B16] transition group-hover:text-[#C9A84C]">
        {product.name_ar}
      </h3>

      {product.description_ar ? (
        <p className="mt-3 line-clamp-2 min-h-[3.5rem] text-sm leading-7 text-[#6F6658]">
          {product.description_ar}
        </p>
      ) : null}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-lg font-black text-[#C9A84C]">{priceLabel}</p>
          {summary.comparePriceLabel ? (
            <p className="text-sm text-[#8B8172] line-through">{summary.comparePriceLabel}</p>
          ) : null}
        </div>

        <span className="rounded-lg border border-[#E8DCC3] bg-[#FFFDF8] px-3 py-1 text-xs font-bold text-[#6F6658]">
          {stockLabel}
        </span>
      </div>
    </Link>
  );
}