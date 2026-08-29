'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

export type MarqueeBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

interface BrandMarqueeSectionProps {
  title?: string;
  subtitle?: string;
  brands: MarqueeBrand[];
  isAr?: boolean;
}

export function BrandMarqueeSection({
  title,
  subtitle,
  brands,
  isAr = true,
}: BrandMarqueeSectionProps): JSX.Element | null {
  if (!brands || brands.length === 0) return null;

  // Duplicate list to guarantee seamless 50% infinite loop without any visual break
  const duplicatedBrands = [...brands, ...brands];

  const defaultTitle = isAr ? 'علامات تجارية عالمية مختارة' : 'Featured World Brands';
  const defaultSubtitle = isAr
    ? 'أشهر الماركات الأوروبية والعالمية الأصلية 100% في مكان واحد'
    : '100% Authentic World-Class Brands in One Place';

  return (
    <section className="relative overflow-hidden border-t border-border/80 bg-background-card py-12 md:py-16">
      {/* Header */}
      <div className="mx-auto mb-8 max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isAr ? 'علامات أصلية معتمدة' : 'Official Brands'}</span>
            </div>
            <h2 className="text-2xl font-black text-text-primary md:text-3xl lg:text-4xl">
              {title || defaultTitle}
            </h2>
            <p className="mt-1.5 text-xs md:text-sm text-[#736B5E] font-medium max-w-xl">
              {subtitle || defaultSubtitle}
            </p>
          </div>

          <Link
            href="/products"
            className="group inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-primary hover:text-primary-dark transition-colors"
          >
            <span>{isAr ? 'تصفح جميع المنتجات' : 'Browse all catalog'}</span>
            {isAr ? (
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            ) : (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            )}
          </Link>
        </div>
      </div>

      {/* Infinite Horizontal Marquee Track Container */}
      <div className="group relative w-full overflow-hidden py-2 select-none" dir="ltr">
        {/* Left & Right luxury gradient edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-32 bg-gradient-to-r from-background-card via-background-card/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-32 bg-gradient-to-l from-background-card via-background-card/80 to-transparent" />

        {/* Continuous Marquee Ribbon */}
        <div className="flex w-max gap-4 sm:gap-6 will-change-transform animate-marquee hover:[animation-play-state:paused]">
          {duplicatedBrands.map((brand, idx) => (
            <Link
              key={`${brand.id}-${idx}`}
              href={`/products?brands=${brand.slug}`}
              className="relative flex h-24 w-44 sm:h-28 sm:w-56 shrink-0 items-center justify-center rounded-2xl border border-[#E8DFC8] bg-white p-4 shadow-sm transition-all duration-300 hover:scale-[1.04] hover:border-primary hover:shadow-md active:scale-[0.98]"
              title={brand.name}
            >
              {brand.logo_url ? (
                <div className="relative h-full w-full">
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    fill
                    sizes="(max-width: 640px) 176px, 224px"
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <span className="text-center text-sm font-black text-[#1F1B16]">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
