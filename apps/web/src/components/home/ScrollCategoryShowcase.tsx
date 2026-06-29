'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductCard } from '@/app/catalog-components';
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProduct,
  CatalogVariant,
} from '@/app/catalog-types';

interface HomeCategorySection {
  category: CatalogCategory;
  products: CatalogProduct[];
  introProduct?: CatalogProduct | null;
  introVideoSrc?: string | null;
}

interface Props {
  sections: HomeCategorySection[];
  variants: CatalogVariant[];
  brands: CatalogBrand[];
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function useScrollProgress(sectionRef: React.RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    function update() {
      const element = sectionRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      /*
        يبدأ التحريك عندما يصل أول القسم إلى منتصف الشاشة.
        قبل ذلك يبقى الفيديو على أول فريم.
        بعد ذلك يصبح التقدم مربوطاً بالسكرول.
      */
      const startLine = vh * 0.5;
      const scrollableDistance = Math.max(1, rect.height - vh * 0.55);
      const next = clamp((startLine - rect.top) / scrollableDistance);

      setProgress(next);
    }

    function onScroll() {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sectionRef]);

  return progress;
}

function ScrollVideo({
  src,
  title,
  fallbackImage,
  progress,
}: {
  src: string;
  title: string;
  fallbackImage?: string | null;
  progress: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !duration || failed) return;

    const targetTime = clamp(progress) * duration;

    try {
      if (Math.abs(video.currentTime - targetTime) > 0.025) {
        video.currentTime = targetTime;
      }
    } catch {
      // بعض المتصفحات تحتاج تحميل metadata أولاً
    }
  }, [progress, duration, failed]);

  if (failed) {
    return <StaticProductIntro title={title} imageUrl={fallbackImage} progress={progress} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-[#D7BE79] bg-[#F3EEE3] shadow-2xl">
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
          event.currentTarget.currentTime = 0;
          event.currentTarget.pause();
        }}
        onError={() => setFailed(true)}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1F1B16]/60 to-transparent p-6 text-white">
        <p className="text-sm font-bold text-[#E8DCC3]">Scroll Controlled Intro</p>
        <h3 className="mt-2 text-3xl font-black">{title}</h3>
      </div>
    </div>
  );
}

function StaticProductIntro({
  title,
  imageUrl,
  progress,
}: {
  title: string;
  imageUrl?: string | null;
  progress: number;
}) {
  const rotate = -8 + progress * 16;
  const translate = 18 - progress * 28;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] border border-[#D7BE79] bg-[#F3EEE3] shadow-2xl">
      <div
        className="relative aspect-[4/5] w-[68%] overflow-hidden rounded-[1.5rem] border border-[#E8DCC3] bg-[#FFFDF8] shadow-2xl transition-transform duration-100"
        style={{
          transform: `translateY(${translate}px) rotate(${rotate}deg) scale(${0.95 + progress * 0.08})`,
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-2xl font-black text-[#C9A84C]">
            {title}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#FFFDF8] via-[#FFFDF8]/80 to-transparent p-6 text-[#1F1B16]">
        <p className="text-sm font-bold text-[#C9A84C]">مقدمة القسم</p>
        <h3 className="mt-2 text-3xl font-black">{title}</h3>
      </div>
    </div>
  );
}

function CategorySection({
  section,
  variants,
  brandLookup,
}: {
  section: HomeCategorySection;
  variants: CatalogVariant[];
  brandLookup: Map<string, CatalogBrand>;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const progress = useScrollProgress(ref);

  const introTitle = section.introProduct?.name_ar || section.category.name_ar;
  const introImage =
    section.introProduct?.image_url ||
    section.introProduct?.thumbnail_url ||
    section.introProduct?.primary_image_url ||
    null;

  const mediaScale = progress > 0.92 ? 1 - (progress - 0.92) * 3.2 : 1;
  const safeScale = Math.max(0.72, mediaScale);

  return (
    <section
      ref={ref}
      id={`section-${section.category.slug}`}
      className="relative min-h-[230vh] border-t border-[#E8DCC3] py-16"
    >
      <div className="sticky top-24 z-10 grid min-h-[calc(100vh-7rem)] items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div
          className="h-[62vh] min-h-[430px] origin-top transition-transform duration-150"
          style={{
            transform: `scale(${safeScale})`,
          }}
        >
          {section.introVideoSrc ? (
            <ScrollVideo
              src={section.introVideoSrc}
              title={introTitle}
              fallbackImage={introImage}
              progress={progress}
            />
          ) : (
            <StaticProductIntro title={introTitle} imageUrl={introImage} progress={progress} />
          )}
        </div>

        <div className="rounded-[2rem] border border-[#E8DCC3] bg-[#FFFDF8]/80 p-6 shadow-xl backdrop-blur">
          <div className="mb-6 text-right">
            <p className="text-sm font-bold text-[#C9A84C]">قسم</p>
            <h2 className="mt-2 text-5xl font-black text-[#1F1B16]">{section.category.name_ar}</h2>
            {section.category.name_en ? (
              <p className="mt-2 text-[#6F6658]">{section.category.name_en}</p>
            ) : null}
          </div>

          {section.products.length === 0 ? (
            <div className="rounded-2xl border border-[#E8DCC3] bg-[#FAF7EF] p-10 text-center text-[#6F6658]">
              لا توجد منتجات في هذا القسم حالياً
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {section.products.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variants={variants}
                  category={section.category}
                  brand={product.brand_id ? brandLookup.get(product.brand_id) : undefined}
                />
              ))}
            </div>
          )}

          <div className="mt-6 text-left">
            <a
              href={`/categories/${section.category.slug}`}
              className="inline-flex rounded-xl border border-[#C9A84C] px-5 py-3 text-sm font-black text-[#C9A84C] transition hover:bg-[#C9A84C] hover:text-[#1F1B16]"
            >
              عرض كل منتجات {section.category.name_ar}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ScrollCategoryShowcase({ sections, variants, brands }: Props) {
  const brandLookup = useMemo(() => new Map(brands.map((brand) => [brand.id, brand])), [brands]);

  return (
    <div className="space-y-0">
      {sections.map((section) => (
        <CategorySection
          key={section.category.id}
          section={section}
          variants={variants}
          brandLookup={brandLookup}
        />
      ))}
    </div>
  );
}