// @ts-nocheck
/* eslint-disable */
import { Suspense } from 'react';
import { FilterableProductGrid } from '../../filterable-product-grid';
import { getTranslations, getLocale } from 'next-intl/server';

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

export default async function ProductsPage() {
  const t = await getTranslations('products');
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-4 py-12 text-[#1F1B16]" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest">{t('productsLabel', { fallback: 'المنتجات' })}</p>
          <h1 className="mt-2 text-4xl font-black">{t('fullCollection', { fallback: 'تشكيلتنا الكاملة' })}</h1>
          <p className="mt-1 text-sm text-[#6F6658]">{t('chooseFromHundreds', { fallback: 'اختر من بين مئات المنتجات' })}</p>
        </div>

        <Suspense fallback={<LoadingGrid />}>
          <FilterableProductGrid />
        </Suspense>
      </div>
    </main>
  );
}
