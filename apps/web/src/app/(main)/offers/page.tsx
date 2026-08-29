/* eslint-disable */
import { Suspense } from 'react';
import { FilterableProductGrid } from '../../filterable-product-grid';
import { getLocale } from 'next-intl/server';
import { Tag, Sparkles, Flame, Percent } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'العروض والتخفيضات الحصرية | يورو ستور',
  description: 'تسوق أفضل العروض والخصومات الحصرية على أشهر الماركات الأوروبية والعالمية الأصلية 100% في يورو ستور.',
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

export default async function OffersPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return (
    <div className="w-full px-4 py-8 md:py-12 text-[#1F1B16]" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Luxury Offers Editorial Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-300/70 bg-gradient-to-br from-[#FFFDF9] via-[#FEF3C7]/40 to-[#FDE68A]/20 p-8 md:p-12 shadow-sm">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/10 px-3.5 py-1 text-xs font-black text-amber-900 dark:text-amber-300 mb-4">
              <Flame className="h-4 w-4 text-amber-600 animate-bounce" />
              <span>{isAr ? 'عروض وتخفيضات موسمية حصرية' : 'Exclusive Seasonal Offers'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1F1B16] leading-tight">
              {isAr ? 'تخفيضات حصرية تصل حتى 25%' : 'Exclusive Sale Up To 25% Off'}
            </h1>
            <p className="mt-3 text-sm md:text-base text-[#6F6658] leading-relaxed">
              {isAr
                ? 'استمتع بأقوى العروض على أشهر الماركات الأوروبية والعالمية (أديداس، نايك، فرزاتشي، بوس، تومي هيلفيغر، مايكل كورس) — جميع المنتجات أصلية 100%.'
                : 'Discover top deals on iconic brands like Adidas, Nike, Versace, Boss, Tommy Hilfiger, and Michael Kors — 100% authentic items.'}
            </p>

            {/* Coupon Code Pill */}
            <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-white/90 px-4 py-2.5 shadow-sm">
              <Percent className="h-4 w-4 text-amber-600" />
              <span className="text-xs md:text-sm font-bold text-[#1F1B16]">
                {isAr ? 'كود خصم ترحيبي إضافي 10%:' : 'Extra 10% Welcome Coupon:'}
              </span>
              <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 font-mono text-xs font-black tracking-wider text-amber-900">
                WELCOME10
              </span>
            </div>
          </div>

          {/* Decorative Sparkle Watermark */}
          <div className="pointer-events-none absolute -end-8 -top-8 text-amber-500/10">
            <Tag size={220} />
          </div>
        </div>

        {/* Filterable Products Grid locked to Sale items */}
        <Suspense fallback={<LoadingGrid />}>
          <FilterableProductGrid initialSaleOnly={true} />
        </Suspense>
      </div>
    </div>
  );
}
