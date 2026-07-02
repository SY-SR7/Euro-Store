'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMotionValue, useSpring, useAnimationFrame } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
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

function getProductImage(product?: CatalogProduct | null) {
  return (
    product?.image_url ||
    product?.thumbnail_url ||
    product?.primary_image_url ||
    product?.main_image_url ||
    product?.cover_image_url ||
    null
  );
}

function StaticProductIntro({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl?: string | null;
}) {
  return (
    <div className="relative flex h-full min-h-[360px] w-full items-center justify-center overflow-hidden rounded-[2rem] border border-[#D7BE79] bg-background-secondary shadow-2xl">
      <div className="relative aspect-[4/5] w-[68%] max-w-[360px] overflow-hidden rounded-[1.5rem] border border-border bg-background-card shadow-2xl">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-2xl font-black text-primary">
            {title}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#FFFDF8] via-[#FFFDF8]/85 to-transparent p-6 text-[#1F1B16]">
        <p className="text-sm font-bold text-primary">مقدمة القسم</p>
        <h3 className="mt-2 text-2xl font-black md:text-3xl">{title}</h3>
      </div>
    </div>
  );
}

function ScrollLockedVideo({
  src,
  title,
  fallbackImage,
  sectionRef,
}: {
  src: string;
  title: string;
  fallbackImage?: string | null;
  sectionRef: React.RefObject<HTMLElement>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef(0);
  const durationRef = useRef(0);
  const touchYRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const metadataReadyRef = useRef(false);

  const targetProgress = useMotionValue(0);
  const smoothProgress = useSpring(targetProgress, {
    damping: 30,
    stiffness: 120,
    mass: 0.1,
  });

  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [lockedHint, setLockedHint] = useState(false);

  function isSectionAtControlLine() {
    const section = sectionRef.current;
    if (!section) return false;

    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const controlLine = vh * 0.5;

    return rect.top <= controlLine && rect.bottom >= controlLine;
  }

  function seekVideo(nextProgress: number) {
    const safeProgress = clamp(nextProgress);
    progressRef.current = safeProgress;
    targetProgress.set(safeProgress);
  }

  useAnimationFrame(() => {
    const video = videoRef.current;
    const duration = durationRef.current;
    if (!video || !duration || !metadataReadyRef.current || failed) return;

    const currentSmooth = smoothProgress.get();
    
    // Only update state occasionally or just let framer motion handle it if we used motion.div, 
    // but here we just update state for the progress bar.
    if (Math.abs(progress - currentSmooth) > 0.005) {
      setProgress(currentSmooth);
    }

    const targetTime = Math.min(duration - 0.001, Math.max(0.001, currentSmooth * duration));
    
    try {
      if (Math.abs(video.currentTime - targetTime) > 0.03) {
        video.currentTime = targetTime;
      }
    } catch {
      // ignore
    }
  });

  function shouldCaptureScroll(deltaY: number) {
    if (!ready || failed) return false;
    if (!isSectionAtControlLine()) return false;

    const currentProgress = progressRef.current;

    if (deltaY > 0 && currentProgress >= 0.999) return false;
    if (deltaY < 0 && currentProgress <= 0.001) return false;

    return true;
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    try {
      video.load();
    } catch {
      // ignore
    }

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onWheel(event: WheelEvent) {
      if (!shouldCaptureScroll(event.deltaY)) {
        setLockedHint(false);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setLockedHint(true);

      /*
        كلما زاد الرقم 3200 صار الفيديو أبطأ مع السكرول.
        كلما نقص صار أسرع.
      */
      const sensitivity = 1 / 3200;
      seekVideo(progressRef.current + event.deltaY * sensitivity);
    }

    function onTouchStart(event: TouchEvent) {
      touchYRef.current = event.touches[0]?.clientY ?? null;
    }

    function onTouchMove(event: TouchEvent) {
      const currentY = event.touches[0]?.clientY ?? null;
      const lastY = touchYRef.current;

      if (currentY === null || lastY === null) return;

      const deltaY = lastY - currentY;

      if (!shouldCaptureScroll(deltaY)) {
        touchYRef.current = currentY;
        setLockedHint(false);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setLockedHint(true);

      const sensitivity = 1 / 2100;
      seekVideo(progressRef.current + deltaY * sensitivity);
      touchYRef.current = currentY;
    }

    function onKeyDown(event: KeyboardEvent) {
      const keyMap: Record<string, number> = {
        ArrowDown: 140,
        PageDown: 650,
        ' ': 650,
        ArrowUp: -140,
        PageUp: -650,
      };

      const deltaY = keyMap[event.key];

      if (!deltaY) return;
      if (!shouldCaptureScroll(deltaY)) {
        setLockedHint(false);
        return;
      }

      event.preventDefault();
      setLockedHint(true);

      const sensitivity = 1 / 3200;
      seekVideo(progressRef.current + deltaY * sensitivity);
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [ready, failed]);

  if (failed) {
    return <StaticProductIntro title={title} imageUrl={fallbackImage} />;
  }

  const completed = progress >= 0.999;
  const frameScale = completed ? 0.62 : 1;
  const frameTranslate = completed ? '-4%' : '0%';

  return (
    <div
      className="relative h-full min-h-[360px] w-full origin-top overflow-hidden rounded-[2rem] border border-[#D7BE79] bg-background-secondary shadow-2xl transition-transform duration-300"
      style={{
        transform: `translateY(${frameTranslate}) scale(${frameScale})`,
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          durationRef.current = video.duration || 0;
          metadataReadyRef.current = true;
          setReady(true);

          try {
            video.pause();
            video.currentTime = 0.001;
          } catch {
            // ignore
          }
        }}
        onCanPlay={() => setReady(true)}
        onError={() => setFailed(true)}
      />

      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background-secondary text-center text-sm font-bold text-primary">
          جار تجهيز الفيديو...
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1F1B16]/75 to-transparent p-5 text-text-primary md:p-6">
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-background-card/25">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-75"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <p className="text-xs font-bold text-[#E8DCC3] md:text-sm">
          {completed
            ? 'اكتمل الفيديو — تابع قسم الأحذية'
            : lockedHint
              ? 'السكرول يتحكم بالفيديو الآن'
              : 'عند منتصف الشاشة سيتحول السكرول إلى تحكم بالفيديو'}
        </p>

        <h3 className="mt-2 text-2xl font-black md:text-3xl">{title}</h3>
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
  const sectionRef = useRef<HTMLElement | null>(null);
  const locale = useLocale();
  const t = useTranslations('home');
  const isAr = locale === 'ar';

  const introTitle = isAr ? (section.introProduct?.name_ar || section.category.name_ar) : (section.introProduct?.name_en || section.category.name_en || section.category.name_ar);
  const introImage = getProductImage(section.introProduct);
  const hasVideo = Boolean(section.introVideoSrc);

  return (
    <section
      ref={sectionRef}
      id={`section-${section.category.slug}`}
      className="relative min-h-[240vh] border-t border-border py-6 md:py-10 md:py-16"
    >
      <div className="sticky top-20 z-10 grid min-h-[calc(100vh-5rem)] items-start gap-6 lg:top-24 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
        <div className="h-[52vh] min-h-[360px] lg:h-[62vh] lg:min-h-[430px]">
          {section.introVideoSrc ? (
            <ScrollLockedVideo
              src={section.introVideoSrc}
              title={introTitle}
              fallbackImage={introImage}
              sectionRef={sectionRef}
            />
          ) : (
            <StaticProductIntro title={introTitle} imageUrl={introImage} />
          )}
        </div>

        <div className="rounded-[2rem] border border-border bg-background-card/95 p-4 shadow-xl backdrop-blur md:p-6">
          <div className="mb-6 text-right">
            <p className="text-sm font-bold text-primary">
              {hasVideo ? 'القسم الأول — فيديو تفاعلي' : 'قسم'}
            </p>
            <h2 className="mt-2 text-4xl font-black text-[#1F1B16] md:text-5xl">
              {isAr ? section.category.name_ar : (section.category.name_en || section.category.name_ar)}
            </h2>
            {(!isAr && section.category.name_ar) ? (
              <p className="mt-2 text-[#6F6658]">{section.category.name_ar}</p>
            ) : null}
            {(isAr && section.category.name_en) ? (
              <p className="mt-2 text-[#6F6658]">{section.category.name_en}</p>
            ) : null}
          </div>

          {section.products.length === 0 ? (
            <div className="rounded-2xl border border-border bg-background p-4 md:p-10 text-center text-[#6F6658]">
              {t('noCategoryProducts')}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
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
            <Link
              href={`/categories/${section.category.slug}`}
              className="inline-flex rounded-xl border border-primary px-5 py-3 text-sm font-black text-primary transition hover:bg-primary hover:text-[#1F1B16]"
            >
              {t('viewAllProducts')} {isAr ? section.category.name_ar : (section.category.name_en || section.category.name_ar)}
            </Link>
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