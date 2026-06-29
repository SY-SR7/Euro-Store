// @ts-nocheck
/* eslint-disable */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import {
  ProductCard } from '@/app/catalog-components';
import { createCatalogLookup, type CatalogBrand, type CatalogCategory, type CatalogProduct, type CatalogVariant } from '@/app/catalog-types';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: { slug: string };
}

export default async function CategoryPage({ params }: CategoryPageProps): Promise<JSX.Element> {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();

  const { data: categoryData } = await supabase
    .from('categories')
    .select('id, name_ar, name_en, slug')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!categoryData) notFound();
  const category = categoryData as CatalogCategory;

  const [{ data: productsData }, { data: brandsData }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name_ar, name_en, slug, description_ar, category_id, brand_id, is_featured')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase.from('brands').select('id, name, slug').eq('is_active', true).order('name'),
  ]);

  const products  = (productsData ?? []) as CatalogProduct[];
  const brands    = (brandsData   ?? []) as CatalogBrand[];
  const productIds = products.map((p) => p.id);

  const { data: variantsData } =
    productIds.length > 0
      ? await supabase
          .from('product_variants')
          .select('id, product_id, sku, price_syp, compare_price_syp, stock_quantity')
          .eq('is_active', true)
          .in('product_id', productIds)
      : { data: [] };

  const variants  = (variantsData ?? []) as CatalogVariant[];
  const brandById = createCatalogLookup(brands);

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-10 text-[#E2E2E2]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <nav className="flex items-center justify-between border-b border-[#2E2E2E] pb-5">
          <Link href="/" className="text-xl font-semibold text-[#C9A84C]">{t('common.appName')}</Link>
          <Link href="/products" className="text-sm text-[#D6D3C7]">{t('catalog.allCategoriesLink')}</Link>
        </nav>
        <header className="py-8">
          <p className="text-sm text-[#C9A84C]">{t('catalog.categoryTag')}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{category.name_ar}</h1>
          <p className="mt-3 text-[#9CA3AF]">{category.name_en}</p>
        </header>
        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">{t('catalog.allProducts')}</h2>
            <span className="text-sm text-[#9CA3AF]">{t('catalog.productCount', { count: products.length })}</span>
          </div>
          {products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variants={variants}
                  category={category}
                  brand={product.brand_id ? brandById.get(product.brand_id) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center text-[#9CA3AF]">
              {t('catalog.noCategoryProducts')}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}