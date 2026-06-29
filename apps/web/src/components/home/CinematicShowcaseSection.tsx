'use client';

import { useRef, useCallback } from 'react';
import { useScroll, useTransform, useSpring, motion, useReducedMotion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { CanvasScrollSequence } from './CanvasScrollSequence';

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
}: {
  beat: StoryBeat;
  scrollProgress: ReturnType<typeof useSpring>;
}) {
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
      dir="rtl"
    >
      {/* Bottom gradient — the ONLY overlay, like DJI */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '55%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
        }}
      />

      {/* Text anchored to bottom-left, DJI style */}
      <div className="relative z-10 px-10 pb-16 md:px-16 md:pb-20 text-right max-w-3xl mr-auto">
        <motion.h2
          className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight"
          style={{
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          {beat.title}
        </motion.h2>

        {beat.subtitle && (
          <p
            className="mt-3 text-sm md:text-base text-white/85 max-w-md leading-relaxed font-medium"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
          >
            {beat.subtitle}
          </p>
        )}

        {beat.ctaLabel && beat.ctaHref && (
          <motion.a
            href={beat.ctaHref}
            className="pointer-events-auto mt-6 inline-flex items-center gap-2 border border-[#C9A84C] text-[#C9A84C] px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-[#C9A84C] hover:text-black transition-colors duration-300"
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

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: prefersReduced ? 1000 : 120,
    damping: prefersReduced ? 100 : 30,
    mass: prefersReduced ? 0.01 : 0.08,
  });

  // Ambient gold glow
  const glowOpacity = useTransform(smoothProgress, [0, 0.25, 0.75, 1], [0, 0.7, 0.7, 0]);
  const glowScale   = useTransform(smoothProgress, [0, 0.5, 1], [0.6, 1.3, 0.8]);

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

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/25 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/25 to-transparent" />
        </div>

        {/* Gold ambient glow */}
        <motion.div
          style={{ opacity: glowOpacity, scale: glowScale }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[55vw] h-[55vh] rounded-full bg-[#C9A84C]/18 blur-[120px]" />
        </motion.div>

        {/* Story text beats */}
        {storyBeats.map((beat, i) => (
          <ScrollBeat key={i} beat={beat} scrollProgress={smoothProgress} />
        ))}

        {/* Brand mark */}
        <div className="absolute top-8 right-8 text-[#C9A84C] text-xs font-bold tracking-[0.3em] uppercase opacity-60 select-none">
          EUROSTORE
        </div>

        {/* Timeline progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-white/10">
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
          <span className="text-white/40 text-[10px] uppercase tracking-[0.25em]">مرر للأسفل</span>
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
