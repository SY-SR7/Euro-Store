/* eslint-disable */
import { Suspense } from 'react';
import { FilterableProductGrid } from '../../filterable-product-grid';
import { getLocale } from 'next-intl/server';
import { Sparkles, Clock, Compass } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'وصل حديثاً | أحدث المنتجات الأوروبية والأصلية | يورو ستور',
  description: 'استكشف أحدث المنتجات والتشكيلات الأوروبية والعالمية الأصلية 100% المضافة إلى يورو ستور هذا الأسبوع.',
};

function LoadingGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-64 rounded-2xl bg-[#F3EDE3] animate-pulse" />
      ))}
    </div>
  );
}

export default async function NewArrivalsPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-14 text-[#1F1B16]" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Luxury New Arrivals Editorial Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-[#E8DFC8] bg-gradient-to-br from-[#FFFDF9] via-[#FAF6ED] to-[#F5EFE0] p-8 md:p-12 shadow-sm">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-black text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span>{isAr ? 'وصل حديثاً لهذا الموسم' : 'Latest Season Drops'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1F1B16] leading-tight">
              {isAr ? 'أحدث التشكيلات العالمية الأصلية' : 'New In — Latest Authentic Arrivals'}
            </h1>
            <p className="mt-3 text-sm md:text-base text-[#6F6658] leading-relaxed">
              {isAr
                ? 'استكشف أحدث ما وصل إلى يورو ستور من السنيكرز، الملابس، العطور، والإكسسوارات الفاخرة من أشهر العلامات التجارية العالمية.'
                : 'Explore our latest curated selection of sneakers, designer apparel, luxury fragrances, and accessories from iconic brands.'}
            </p>
          </div>

          {/* Decorative Clock Watermark */}
          <div className="pointer-events-none absolute -end-8 -top-8 text-primary/10">
            <Compass size={220} />
          </div>
        </div>

        {/* Filterable Products Grid sorted by newest */}
        <Suspense fallback={<LoadingGrid />}>
          <FilterableProductGrid initialSort="newest" />
        </Suspense>
      </div>
    </main>
  );
}
