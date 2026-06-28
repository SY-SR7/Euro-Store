// @ts-nocheck
/* eslint-disable */
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import {
  ProductCard } from '../catalog-components';
import { createCatalogLookup, type CatalogBrand, type CatalogCategory, type CatalogProduct, type CatalogVariant } from '../catalog-types';

export const dynamic = 'force-dynamic';

export default async function Home(): Promise<JSX.Element> {
  const t = await getTranslations();
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);

  const [
    { data: heroSection },
    { data: categories },
    { data: featuredProductsData },
    { data: brandsData },
  ] = await Promise.all([
    supabase.from('homepage_sections').select('section_key, title_ar, title_en, content').eq('section_key', 'hero').eq('is_active', true).maybeSingle(),
    supabase.from('categories').select('id, name_ar, name_en, slug').eq('is_active', true).order('sort_order', { ascending: true }).limit(6),
    supabase.from('products').select('id, name_ar, name_en, slug, description_ar, category_id, brand_id, is_featured').eq('is_featured', true).eq('is_active', true).order('created_at', { ascending: false }).limit(4),
    supabase.from('brands').select('id, name, slug').eq('is_active', true),
  ]);

  const featuredProducts = (featuredProductsData ?? []) as CatalogProduct[];
  const brands = (brandsData ?? []) as CatalogBrand[];
  const featuredIds = featuredProducts.map((p) => p.id);

  const { data: variantsData } =
    featuredIds.length > 0
      ? await supabase.from('product_variants').select('id, product_id, sku, price_syp, compare_price_syp, stock_quantity').eq('is_active', true).in('product_id', featuredIds)
      : { data: [] };

  const variants = (variantsData ?? []) as CatalogVariant[];
  const categoryById = createCatalogLookup((categories ?? []) as CatalogCategory[]);
  const brandById = createCatalogLookup(brands);

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2]">
      {/* ── Header ── */}
      <header className="border-b border-[#2E2E2E] px-6 py-4">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <p className="text-xl font-semibold text-[#C9A84C]">{t('common.appName')}</p>
          <div className="flex gap-4 text-sm text-[#D6D3C7]">
            <Link href="/products" className="hover:text-[#C9A84C] transition-colors">{t('nav.shop')}</Link>
            <Link href="/auth/login" className="hover:text-[#C9A84C] transition-colors">{t('nav.login')}</Link>
            <Link href="/auth/register" className="rounded-sm bg-[#C9A84C] px-4 py-1.5 text-[#111] font-medium hover:bg-[#D8B95F] transition-colors">{t('nav.register')}</Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12">
        {/* ── Hero ── */}
        <section className="grid gap-8 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <p className="text-sm text-[#C9A84C] tracking-widest uppercase">{t('home.tagline')}</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight md:text-7xl">
              {heroSection?.title_ar ?? t('home.heroTitle')}
            </h1>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-7 text-[#9CA3AF]">
              {heroSection?.title_en ?? t('home.heroSubtitle')}
            </p>
            <Link href="/products" className="inline-flex w-fit items-center gap-2 rounded-sm bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors">
              {t('home.shopNow')}
              <span aria-hidden>←</span>
            </Link>
          </div>
        </section>

        {/* ── Featured Products ── */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#C9A84C] uppercase tracking-widest">{t('home.featuredTag')}</p>
                <h2 className="mt-2 text-3xl font-semibold">{t('home.featuredTitle')}</h2>
              </div>
              <Link href="/products" className="text-sm text-[#C9A84C] hover:underline underline-offset-4">
                {t('common.viewAll')}
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variants={variants}
                  category={product.category_id ? categoryById.get(product.category_id) : undefined}
                  brand={product.brand_id ? brandById.get(product.brand_id) : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Category Grid ── */}
        {(categories ?? []).length > 0 && (
          <section className="border-t border-[#2E2E2E] pt-12">
            <div className="mb-6">
              <p className="text-xs text-[#C9A84C] uppercase tracking-widest">{t('home.categoriesTag')}</p>
              <h2 className="mt-2 text-3xl font-semibold">{t('home.categoriesTitle')}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(categories ?? []).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group flex items-center justify-between rounded-md border border-[#2E2E2E] bg-[#151515] p-5 transition hover:border-[#C9A84C] hover:bg-[#1C1C1C]"
                >
                  <div>
                    <span className="text-base font-medium text-[#E2E2E2] group-hover:text-[#C9A84C] transition-colors">{category.name_ar}</span>
                    <span className="mt-1 block text-sm text-[#9CA3AF]">{category.name_en}</span>
                  </div>
                  <span className="text-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden>←</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Footer Strip ── */}
        <footer className="border-t border-[#2E2E2E] pt-8 text-center text-xs text-[#6B7280]">
          <p>© {new Date().getFullYear()} EuroStore · {t('home.footerTagline')}</p>
        </footer>
      </div>
    </main>
  );
}
