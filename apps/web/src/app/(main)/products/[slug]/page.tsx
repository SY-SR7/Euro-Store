'use client';
/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatSYP } from '@eurostore/shared';
import { createServerSupabaseClient } from '@/supabase-server';
import {
  summarizeProductVariants } from '@/app/catalog-components';
import { type CatalogBrand, type CatalogCategory, type CatalogProduct, type CatalogVariant } from '@/app/catalog-types';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

export const dynamic = 'force-dynamic';

interface ProductPageProps { params: { slug: string } }

export default function ProductPage({ params }: ProductPageProps): Promise<JSX.Element> {
  const t = useTranslations();
  const supabase = createServerSupabaseClient();

  const { data: productData } = await supabase
    .from('products')
    .select('id, name_ar, name_en, slug, description_ar, category_id, brand_id, is_featured')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!productData) notFound();
  const product = productData as CatalogProduct;

  const [variantsResult, categoryResult, brandResult, primaryImageResult] = await Promise.all([
    supabase
      .from('product_variants')
      .select('id, product_id, sku, price_syp, compare_price_syp, stock_quantity')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .order('price_syp', { ascending: true }),
    product.category_id
      ? supabase.from('categories').select('id, name_ar, name_en, slug').eq('id', product.category_id).eq('is_active', true).maybeSingle()
      : Promise.resolve({ data: null }),
    product.brand_id
      ? supabase.from('brands').select('id, name, slug').eq('id', product.brand_id).eq('is_active', true).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('product_images')
      .select('url')
      .eq('product_id', product.id)
      .eq('is_primary', true)
      .maybeSingle(),
  ]);

  const variants      = (variantsResult.data ?? []) as CatalogVariant[];
  const category      = categoryResult.data as CatalogCategory | null;
  const brand         = brandResult.data    as CatalogBrand    | null;
  const primaryImage  = primaryImageResult.data?.url ?? null;
  const summary       = summarizeProductVariants(variants);
  const cheapestVariant = variants[0] ?? null;

  const priceLabel = summary.priceLabel === '—' ? t('catalog.priceSoon') : summary.priceLabel;
  const stockLabel = summary.priceLabel === '—'
    ? t('catalog.stockUpdate')
    : summary.totalStock > 0
    ? t('catalog.inStock', { count: summary.totalStock })
    : t('catalog.outOfStock');

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <nav className="flex items-center justify-between border-b border-[#2E2E2E] pb-5">
          <Link href="/" className="text-xl font-semibold text-[#C9A84C]">{t('common.appName')}</Link>
          <div className="flex items-center gap-4">
            <Link href="/products" className="text-sm text-[#D6D3C7]">{t('catalog.allCategoriesLink')}</Link>
            <Link href="/cart" className="text-sm text-[#D6D3C7] hover:text-[#C9A84C] transition-colors">{t('cart.title')}</Link>
          </div>
        </nav>

        <section className="grid gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          {/* Image */}
          <div className="flex min-h-[420px] items-center justify-center rounded-md border border-[#2E2E2E] bg-[#1B1B1B] p-8 text-center overflow-hidden">
            {primaryImage ? (
              <img src={primaryImage} alt={product.name_ar} className="h-full w-full object-cover rounded-md" />
            ) : (
              <div>
                <p className="text-sm text-[#9CA3AF]">{brand?.name ?? t('common.appName')}</p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#C9A84C] md:text-6xl">{product.name_ar}</h1>
                <p className="mt-4 text-lg text-[#D6D3C7]">{product.name_en}</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
                {category ? (
                  <Link href={`/categories/${category.slug}`} className="text-[#C9A84C] hover:underline">
                    {category.name_ar}
                  </Link>
                ) : null}
                {brand ? <span>{brand.name}</span> : null}
                {product.is_featured ? (
                  <span className="rounded-sm border border-[#C9A84C] px-2 py-1 text-xs text-[#C9A84C]">
                    {t('catalog.featured')}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 text-3xl font-semibold">{product.name_ar}</h2>
              <p className="mt-4 leading-8 text-[#B8B8B8]">{product.description_ar}</p>
            </div>

            {/* Price box */}
            <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-5">
              <p className="text-sm text-[#9CA3AF]">{t('catalog.priceFrom')}</p>
              <div className="mt-2 flex items-end gap-3">
                <strong className="text-3xl text-[#C9A84C]">{priceLabel}</strong>
                {summary.comparePriceLabel ? (
                  <span className="pb-1 text-sm text-[#6B7280] line-through">{summary.comparePriceLabel}</span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-[#9CA3AF]">{stockLabel}</p>
            </div>

            {/* Add to cart */}
            {cheapestVariant && (
              <AddToCartButton
                variantId={cheapestVariant.id}
                productId={product.id}
                productSlug={product.slug}
                nameAr={product.name_ar}
                nameEn={product.name_en}
                sku={cheapestVariant.sku}
                priceSyp={cheapestVariant.price_syp}
                comparePriceSyp={cheapestVariant.compare_price_syp}
                imageUrl={primaryImage}
                outOfStock={summary.totalStock === 0}
              />
            )}

            {/* Variants table */}
            {variants.length > 0 && (
              <section className="rounded-md border border-[#2E2E2E] bg-[#151515] p-5">
                <h3 className="text-lg font-semibold">{t('catalog.availableOptions')}</h3>
                <div className="mt-4 overflow-hidden rounded-md border border-[#2E2E2E]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#202020] text-[#9CA3AF]">
                      <tr>
                        <th className="px-4 py-3 text-start font-medium">SKU</th>
                        <th className="px-4 py-3 text-start font-medium">{t('catalog.price')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('catalog.stock')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2E2E2E]">
                      {variants.map((variant: any) => (
                        <tr key={variant.id}>
                          <td className="px-4 py-3 text-[#D6D3C7] font-mono text-xs">{variant.sku}</td>
                          <td className="px-4 py-3 text-[#C9A84C]">{formatSYP(variant.price_syp)}</td>
                          <td className="px-4 py-3 text-[#D6D3C7]">{variant.stock_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}