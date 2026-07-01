// @ts-nocheck
/* eslint-disable */
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { FilterableProductGrid } from '../../../filterable-product-grid';

export const dynamic = 'force-dynamic';

function LoadingGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-64 rounded-2xl bg-[#F3EDE3] animate-pulse" />
      ))}
    </div>
  );
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const locale = await getLocale();
  const t = await getTranslations('catalog');
  const isAr = locale === 'ar';
  const supabase = createServerSupabaseClient();

  const { data: category } = await supabase
    .from('categories')
    .select('id,name_ar,name_en,slug,is_active')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!category) notFound();

  return (
    <main className={`min-h-screen bg-[#FAF7EF] px-6 py-12 text-[#1F1B16]`} dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl space-y-10">
        <Link href="/categories" className="text-sm font-bold text-[#C9A84C] hover:underline">
          {isAr ? '←' : '→'} {t('allCategoriesLink')}
        </Link>

        <section className={`border-b border-[#E8DCC3] pb-10 ${isAr ? 'text-right' : 'text-left'}`}>
          <p className="text-sm font-bold text-[#C9A84C]">{t('categoryTag')}</p>
          <h1 className="mt-3 text-6xl font-black">{isAr ? category.name_ar : (category.name_en || category.name_ar)}</h1>
          {(!isAr && category.name_ar) && (
            <p className="mt-3 text-lg text-[#6F6658]" dir="rtl">{category.name_ar}</p>
          )}
          {(isAr && category.name_en) && (
            <p className="mt-3 text-lg text-[#6F6658]" dir="ltr">{category.name_en}</p>
          )}
        </section>

        <section>
          <h2 className="mb-8 text-2xl font-black">{t('allProducts')}</h2>
          <Suspense fallback={<LoadingGrid />}>
            <FilterableProductGrid lockedCategorySlug={category.slug} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
