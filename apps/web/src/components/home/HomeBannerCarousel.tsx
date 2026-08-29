'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export type HomeBanner = {
  id: string;
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  image_url?: string;
  mobile_image_url?: string;
  video_url?: string;
  cta_url?: string;
  cta_label_ar?: string;
  cta_label_en?: string;
  is_active?: boolean;
  sort_order?: number;
};

export function HomeBannerCarousel({ banners, locale }: { banners: HomeBanner[]; locale: string }) {
  const [active, setActive] = useState(0);
  const isAr = locale === 'ar';

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % banners.length), 7000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const go = (direction: number) => {
    setActive((index) => (index + direction + banners.length) % banners.length);
  };

  return (
    <section className="relative min-h-[34rem] h-[82svh] max-h-[54rem] overflow-hidden bg-black text-white" aria-roledescription="carousel">
      {banners.map((banner, index) => {
        const visible = index === active;
        const title = isAr ? banner.title_ar : banner.title_en;
        const subtitle = isAr ? banner.subtitle_ar : banner.subtitle_en;
        const ctaLabel = isAr ? banner.cta_label_ar : banner.cta_label_en;
        return (
          <article key={banner.id} aria-hidden={!visible} className={`absolute inset-0 transition-opacity duration-700 ${visible ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}>
            {banner.mobile_image_url ? <Image src={banner.mobile_image_url} alt={title || ''} fill priority={index === 0} className="object-cover md:hidden" sizes="100vw" /> : null}
            {banner.video_url ? (
              <video src={banner.video_url} className={`h-full w-full object-cover ${banner.mobile_image_url ? 'hidden md:block' : ''}`} autoPlay={visible} muted loop playsInline preload={visible ? 'metadata' : 'none'} />
            ) : banner.image_url ? (
              <Image src={banner.image_url} alt={title || ''} fill priority={index === 0} className={`object-cover ${banner.mobile_image_url ? 'hidden md:block' : ''}`} sizes="100vw" />
            ) : null}
            <div className="absolute inset-0 bg-black/45" />
            <div className={`absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-7xl items-end px-5 pb-8 pt-28 md:px-10 md:pb-20 ${isAr ? 'justify-end' : 'justify-start'}`}>
              <div className={`w-full max-w-lg ${isAr ? 'text-right' : 'text-left'}`}>
                {title ? <h1 className="text-3xl font-black leading-tight md:text-5xl">{title}</h1> : null}
                {subtitle ? <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 md:text-lg">{subtitle}</p> : null}
                {banner.cta_url && ctaLabel ? (
                  <Link href={banner.cta_url} className="mt-7 inline-flex min-h-11 items-center bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-primary">
                    {ctaLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}

      {banners.length > 1 ? (
        <div className="absolute bottom-6 end-5 z-20 flex items-center gap-2 md:end-10">
          <button type="button" onClick={() => go(-1)} title={isAr ? 'الشريحة السابقة' : 'Previous slide'} className="grid h-10 w-10 place-items-center border border-white/50 bg-black/35 text-white backdrop-blur-sm hover:bg-black/60">
            <ChevronLeft size={20} className={isAr ? 'rotate-180' : ''} />
          </button>
          <span className="min-w-12 text-center text-xs font-bold" aria-live="polite">{active + 1} / {banners.length}</span>
          <button type="button" onClick={() => go(1)} title={isAr ? 'الشريحة التالية' : 'Next slide'} className="grid h-10 w-10 place-items-center border border-white/50 bg-black/35 text-white backdrop-blur-sm hover:bg-black/60">
            <ChevronRight size={20} className={isAr ? 'rotate-180' : ''} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
