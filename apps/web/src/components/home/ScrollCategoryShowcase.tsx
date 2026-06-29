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

function productImage(product?: CatalogProduct | null) {
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
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] border border-[#D7BE79] bg-[#F3EEE3] shadow-2xl">
      <div className="relative aspect-[4/5] w-[68%] overflow-hidden rounded-[1.5rem] border border-[#E8DCC3] bg-[#FFFDF8] shadow-2xl">
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
  const rafRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  function applyProgress(nextProgress: number) {
    const safe = clamp(nextProgress);
    progressRef.current = safe;
    setProgress(safe);

    const video = videoRef.current;
    const duration = durationRef.current;

    if (!video || !duration || failed) return;

    window.cancelAnimationFrame(rafRef.current);

    rafRef.current = window.requestAnimationFrame(() => {
      const targetTime = safe * duration;

      try {
        if (Math.abs(video.currentTime - targetTime) > 0.035) {
          if ('fastSeek' in video && typeof video.fastSeek === 'function') {
            video.fastSeek(targetTime);
          } else {
            video.currentTime = targetTime;
          }
        }
      } catch {
        try {
          video.currentTime = targetTime;
        } catch {
          // ignore
        }
      }
    });
  }

  function sectionAtLockLine() {
    const section = sectionRef.current;
    if (!section) return false;

    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const lockLine = vh * 0.5;

    return rect.top <= lockLine && rect.bottom >= lockLine;
  }

  useEffect(() => {
    function updateLockState() {
      const active = sectionAtLockLine();
      const p = progressRef.current;

      /*
        القفل يعمل عندما يكون الفيديو عند منتصف الشاشة
        ولم ننتهِ بالكامل، أو عندما نرجع للأعلى والفيديو ليس في البداية.
      */
      setIsLocked(active && p > 0.001 && p < 0.999);
    }

    updateLockState();
    window.addEventListener('scroll', updateLockState, { passive: true });
    window.addEventListener('resize', updateLockState);

    return () => {
      window.removeEventListener('scroll', updateLockState);
      window.removeEventListener('resize', updateLockState);
    };
  }, [sectionRef]);

  useEffect(() => {
    function shouldCapture(deltaY: number) {
      if (!sectionAtLockLine()) return false;

      const p = progressRef.current;

      if (deltaY > 0 && p >= 0.999) return false;
      if (deltaY < 0 && p <= 0.001) return false;

      return true;
    }

    function onWheel(event: WheelEvent) {
      if (!shouldCapture(event.deltaY)) return;

      event.preventDefault();

      const speed = 1 / 2600;
      const next = progressRef.current + event.deltaY * speed;
      applyProgress(next);
      setIsLocked(progressRef.current > 0.001 && progressRef.current < 0.999);
    }

    function onTouchStart(event: TouchEvent) {
      touchYRef.current = event.touches[0]?.clientY ?? null;
    }

    function onTouchMove(event: TouchEvent) {
      const currentY = event.touches[0]?.clientY ?? null;
      const lastY = touchYRef.current;

      if (currentY === null || lastY === null) return;

      const deltaY = lastY - currentY;

      if (!shouldCapture(deltaY)) {
        touchYRef.current = currentY;
        return;
      }

      event.preventDefault();

      const speed = 1 / 1600;
      const next = progressRef.current + deltaY * speed;
      applyProgress(next);
      touchYRef.current = currentY;
      setIsLocked(progressRef.current > 0.001 && progressRef.current < 0.999);
    }

    function onKeyDown(event: KeyboardEvent) {
      const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'];

      if (!keys.includes(event.key)) return;

      let deltaY = 0;

      if (event.key === 'ArrowDown') deltaY = 120;
      if (event.key === 'PageDown' || event.key === ' ') deltaY = 520;
      if (event.key === 'ArrowUp') deltaY = -120;
      if (event.key === 'PageUp') deltaY = -520;
      if (event.key === 'Home') deltaY = -9999;
      if (event.key === 'End') deltaY = 9999;

      if (!shouldCapture(deltaY)) return;

      event.preventDefault();

      const speed = 1 / 2600;
      applyProgress(progressRef.current + deltaY * speed);
      setIsLocked(progressRef.current > 0.001 && progressRef.current < 0.999);
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sectionRef, failed]);

  if (failed) {
    return <StaticProductIntro title={title} imageUrl={fallbackImage} />;
  }

  const completed = progress >= 0.999;
  const scale = completed ? 0.58 : 1;
  const translateY = completed ? -18 : 0;

  return (
    <div
      className="relative h-full w-full origin-top overflow-hidden rounded-[2rem] border border-[#D7BE79] bg-[#F3EEE3] shadow-2xl transition-transform duration-300"
      style={{
        transform: `translateY(${translateY}px) scale(${scale})`,
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
          video.pause();
          video.currentTime = 0;
        }}
        onError={() => setFailed(true)}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1F1B16]/70 to-transparent p-6 text-white">
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-[#C9A84C]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <p className="text-sm font-bold text-[#E8DCC3]">
          {completed ? 'اكتملت مقدمة الفيديو — تابع القسم' : isLocked ? 'السكرول يتحكم بالفيديو الآن' : 'تابع السكرول حتى منتصف الشاشة'}
        </p>

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

  const introTitle = section.introProduct?.name_ar || section.category.name_ar;
  const introImage = productImage(section.introProduct);
  const isShoesVideo = Boolean(section.introVideoSrc);

  return (
    <section
      ref={ref}
      id={`section-${section.category.slug}`}
      className="relative min-h-[260vh] border-t border-[#E8DCC3] py-16"
    >
      <div className="sticky top-24 z-10 grid min-h-[calc(100vh-7rem)] items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="h-[62vh] min-h-[430px]">
          {section.introVideoSrc ? (
            <ScrollLockedVideo
              src={section.introVideoSrc}
              title={introTitle}
              fallbackImage={introImage}
              sectionRef={ref}
            />
          ) : (
            <StaticProductIntro title={introTitle} imageUrl={introImage} />
          )}
        </div>

        <div className="rounded-[2rem] border border-[#E8DCC3] bg-[#FFFDF8]/90 p-6 shadow-xl backdrop-blur">
          <div className="mb-6 text-right">
            <p className="text-sm font-bold text-[#C9A84C]">
              {isShoesVideo ? 'القسم الأول — تجربة فيديو تفاعلية' : 'قسم'}
            </p>
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