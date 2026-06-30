'use client';

import { useRef, useCallback } from 'react';
import { useScroll, useTransform, useSpring, motion, useReducedMotion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { CanvasScrollSequence } from './CanvasScrollSequence';
import { useLocale, useTranslations } from 'next-intl';

export interface StoryBeat {
  /** 0–1 متى يبدأ */
  from: number;
  /** 0–1 متى ينتهي */
  to: number;
  /** العنوان العربي */
  title: string;
  /** النص التوضيحي */
  subtitle?: string;
  /** نص الزر (اختياري) */
  ctaLabel?: string;
  /** رابط الزر */
  ctaHref?: string;
}

interface Props {
  /**
   * نمط مسار الصورة — استخدم {index} كـ placeholder لرقم الإطار (0-based).
   * مثال: "/frames/shoes/frame_{index}.jpg"
   * يمكن أيضاً استخدام "{index:04d}" للترقيم بصفر padding
   */
  frameSrcPattern: string;
  /** عدد الإطارات الكلي */
  frameCount: number;
  /** ارتفاع مساحة السكرول — مثال: "300vh" */
  scrollHeight?: string;
  /** نصوص القصة التي تظهر على مراحل */
  storyBeats: StoryBeat[];
  /** لون الخلفية خلف الكانفاس */
  bgColor?: string;
}

function ScrollBeat({
  beat,
  scrollProgress,
  isLightBg,
}: {
  beat: StoryBeat;
  scrollProgress: ReturnType<typeof useSpring>;
  isLightBg?: boolean;
}) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const opacity = useTransform(
    scrollProgress,
    [
      Math.max(0, beat.from - 0.05),
      beat.from,
      beat.to,
      Math.min(1, beat.to + 0.05),
    ],
    [0, 1, 1, 0],
  );

  const y = useTransform(
    scrollProgress,
    [Math.max(0, beat.from - 0.08), beat.from],
    ['24px', '0px'],
  );

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col justify-end pointer-events-none will-change-transform"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Frosted glass text card — removed for clean look */}
      <div
        className="relative z-10 mx-8 mb-12 md:mx-14 md:mb-16 text-right max-w-xs md:max-w-sm mr-auto px-6 py-5"
      >
        {/* Pre-Title Label */}
        <p className={`text-[10px] font-bold tracking-[0.25em] uppercase mb-2 ${isLightBg ? 'text-black opacity-60' : 'text-[#C9A84C] opacity-80'}`}>
          EUROSTORE
        </p>

        {/* Title */}
        <motion.h2
          className={`text-2xl md:text-3xl lg:text-4xl font-black leading-tight ${isLightBg ? 'text-black' : 'text-white'}`}
          style={{
            filter: isLightBg ? 'none' : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))'
          }}
        >
          {beat.title}
        </motion.h2>

        {/* Subtitle */}
        <p className={`mt-2 text-xs md:text-sm leading-relaxed font-semibold tracking-wide ${isLightBg ? 'text-[#333333]' : 'text-[#D4D4D4] drop-shadow-sm'}`}>
          {beat.subtitle}
        </p>

        {/* CTA Button */}
        {beat.ctaLabel && beat.ctaHref && (
          <motion.a
            href={beat.ctaHref}
            className={`pointer-events-auto mt-6 inline-flex items-center gap-2 px-6 py-3 text-xs font-bold tracking-widest uppercase transition-colors duration-300 rounded-lg ${
              isLightBg 
                ? 'bg-black text-white hover:bg-black/80' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {beat.ctaLabel}
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Bridge: syncs smoothProgress motion value → canvas progress state
 * using useAnimationFrame to avoid React re-renders on every frame.
 */
function CanvasBridge({
  smoothProgress,
  frameSrc,
  frameCount,
}: {
  smoothProgress: ReturnType<typeof useSpring>;
  frameSrc: (i: number) => string;
  frameCount: number;
}) {
  // Writable motion value — will be read by CanvasScrollSequence
  const liveProgress = useMotionValue(0);

  useAnimationFrame(() => {
    liveProgress.set(smoothProgress.get());
  });

  // CanvasScrollSequence reads `progress` prop, but we need reactivity.
  // So we subscribe and force-render only on significant change.
  const progressRef = useRef(0);
  const sequenceRef = useRef<{ seek: (p: number) => void } | null>(null);

  // On every frame, directly call into the canvas without React re-render
  useAnimationFrame(() => {
    const current = smoothProgress.get();
    if (Math.abs(current - progressRef.current) > 0.0005) {
      progressRef.current = current;
      sequenceRef.current?.seek(current);
    }
  });

  return (
    <CanvasScrollSequence
      ref={sequenceRef}
      frameSrc={frameSrc}
      frameCount={frameCount}
      progress={0} // initial only — updates come from imperative seek()
      quality="high"
      className="absolute inset-0"
    />
  );
}

export function CinematicShowcaseSection({
  frameSrcPattern,
  frameCount,
  scrollHeight = '350vh',
  storyBeats,
  bgColor = '#0C0C0C',
}: Props) {
  // Build the frameSrc function from the pattern string — stays client-side only
  const frameSrc = useCallback(
    (index: number) => {
      // Support {index:04d} padding notation
      const padded = String(index + 1).padStart(4, '0');
      return frameSrcPattern
        .replace('{index:04d}', padded)
        .replace('{index}', String(index));
    },
    [frameSrcPattern],
  );
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('home.hero');

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: prefersReduced ? 1000 : 120,
    damping: prefersReduced ? 100 : 30,
    mass: prefersReduced ? 0.01 : 0.08,
  });

  // Progress bar
  const barScaleX = useTransform(smoothProgress, [0, 1], [0, 1]);

  // Scroll hint
  const scrollHintOpacity = useTransform(smoothProgress, [0, 0.06], [1, 0]);

  return (
    <div
      ref={containerRef}
      style={{ height: scrollHeight }}
      className="relative"
    >
      {/* Sticky viewport */}
      <div
        className="sticky top-0 h-screen overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Canvas — GPU accelerated */}
        <div
          className="absolute inset-0"
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        >
          <CanvasScrollSequence
            frameSrc={frameSrc}
            frameCount={frameCount}
            progress={0}
            quality="high"
            className="absolute inset-0"
            smoothProgress={smoothProgress}
          />
        </div>

        {/* No gradients - pure cinematic video background */}

        {/* Story text beats */}
        {storyBeats.map((beat, i) => (
          <ScrollBeat key={i} beat={beat} scrollProgress={smoothProgress} isLightBg={bgColor === '#dfdcd3'} />
        ))}

        {/* Brand mark */}
        <div className="absolute top-8 right-8 text-white text-xs font-bold tracking-[0.3em] uppercase opacity-50 select-none">
          EUROSTORE
        </div>

        {/* Timeline progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/10">
          <motion.div
            style={{ scaleX: barScaleX, transformOrigin: 'left' }}
            className="h-full bg-[#C9A84C] will-change-transform"
          />
        </div>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: scrollHintOpacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-white/40 text-[10px] uppercase tracking-[0.25em]">{t('scrollDown', { fallback: 'مرر للأسفل' })}</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-[#C9A84C]/60 to-transparent"
          />
        </motion.div>
      </div>
    </div>
  );
}
