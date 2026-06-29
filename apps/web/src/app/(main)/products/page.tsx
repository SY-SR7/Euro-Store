/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { ProductCard } from '@/app/catalog-components';
import {
  createCatalogLookup,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogVariant,
} from '@/app/catalog-types';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
  searchParams?: { q?: string | string[]; category?: string | string[] };
}

function getSearchTerm(searchParams?: ProductsPageProps['searchParams']): string {
  const raw = searchParams?.q;
  const val = Array.isArray(raw) ? raw[0] : raw;
  return val?.trim() ?? '';
}

function getCategoryFilter(searchParams?: ProductsPageProps['searchParams']): string {
  const raw = searchParams?.category;
  const val = Array.isArray(raw) ? raw[0] : raw;
  return val?.trim() ?? '';
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps): Promise<JSX.Element> {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();
  const search = getSearchTerm(searchParams);
  const categoryFilter = getCategoryFilter(searchParams);

  let productsQuery = supabase
    .from('products')
    .select('id, name_ar, name_en, slug, description_ar, category_id, brand_id, is_featured, product_images(id, product_id, url, alt_text, is_primary, sort_order)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (search) {
    productsQuery = productsQuery.textSearch('search_vector', search, {
      type: 'websearch',
      config: 'simple',
    });
  }
  if (categoryFilter) {
    productsQuery = productsQuery.eq('category_id', categoryFilter);
  }

  const [{ data: productsData }, { data: categoriesData }, { data: brandsData }] =
    await Promise.all([
      productsQuery,
      supabase
        .from('categories')
        .select('id, name_ar, name_en, slug')
        .eq('is_active', true)
        .order('sort_order'),
      supabase.from('brands').select('id, name, slug').eq('is_active', true).order('name'),
    ]);

  const products = (productsData ?? []) as CatalogProduct[];
  const categories = (categoriesData ?? []) as CatalogCategory[];
  const brands = (brandsData ?? []) as CatalogBrand[];
  const productIds = products.map((p) => p.id);

  const { data: variantsData } =
    productIds.length > 0
      ? await supabase
          .from('product_variants')
          .select('id, product_id, sku, price_syp, compare_price_syp, stock_quantity')
          .eq('is_active', true)
          .in('product_id', productIds)
      : { data: [] };

  const variants = (variantsData ?? []) as CatalogVariant[];
  const categoryById = createCatalogLookup(categories);
  const brandById = createCatalogLookup(brands);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 flex flex-col gap-10">

      {/* ”€”€ Page Header + Search ”€”€ */}
      <header className="grid gap-6 py-4 md:grid-cols-[1fr_0.9fr] md:items-end">
        <div>
          <p className="text-xs text-[#C9A84C] uppercase">
            {t('catalog.catalogTag')}
          </p>
          <h1 className="mt-3 font-headline text-4xl font-bold leading-tight md:text-6xl">
            {t('catalog.title')}
          </h1>
        </div>
        <form action="/products" className="flex gap-3">
          <input
            name="q"
            defaultValue={search}
            placeholder={t('catalog.searchPlaceholder')}
            className="min-w-0 flex-1 rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-sm text-[#F4F1E8] outline-none transition placeholder:text-[#8B8172] focus:border-[#C9A84C]"
          />
          <button
            type="submit"
            className="rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#D8B95F]"
          >
            {t('catalog.searchBtn')}
          </button>
        </form>
      </header>

      {/* ”€”€ Category Pills ”€”€ */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-sm border px-3 py-2 text-sm transition ${
            !categoryFilter
              ? 'border-[#C9A84C] text-[#C9A84C]'
              : 'border-[#E8DCC3] text-[#D6D3C7] hover:border-[#C9A84C] hover:text-[#C9A84C]'
          }`}
        >
          {t('common.all')}
        </Link>
        {categories.map((category: any) => (
          <Link
            key={category.id}
            href={`/products?category=${category.id}${search ? `&q=${search}` : ''}`}
            className={`rounded-sm border px-3 py-2 text-sm transition ${
              categoryFilter === category.id
                ? 'border-[#C9A84C] text-[#C9A84C]'
                : 'border-[#E8DCC3] text-[#D6D3C7] hover:border-[#C9A84C] hover:text-[#C9A84C]'
            }`}
          >
            {category.name_ar}
          </Link>
        ))}
      </div>

      {/* ”€”€ Product Grid ”€”€ */}
      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">
            {search
              ? t('catalog.searchResults', { query: search })
              : t('catalog.allProducts')}
          </h2>
          <span className="text-sm text-[#6F6658]">
            {t('catalog.productCount', { count: products.length })}
          </span>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variants={variants}
                category={
                  product.category_id
                    ? categoryById.get(product.category_id)
                    : undefined
                }
                brand={
                  product.brand_id ? brandById.get(product.brand_id) : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] p-8 text-center text-[#6F6658]">
            {t('catalog.noProducts')}
          </div>
        )}
      </div>
    </section>
  );
}
