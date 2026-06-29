'use client';

import { useRef } from 'react';
import { useScroll, useTransform, useSpring, motion, useReducedMotion } from 'framer-motion';
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
  /** مسار الصور: يستقبل رقم الإطار (0-based) ويعيد مسار الصورة */
  frameSrc: (index: number) => string;
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
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none will-change-transform"
      dir="rtl"
    >
      <motion.h2
        className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4 drop-shadow-lg"
        style={{ textShadow: '0 2px 40px rgba(0,0,0,0.6)' }}
      >
        {beat.title}
      </motion.h2>

      {beat.subtitle && (
        <p className="text-base md:text-xl text-white/80 max-w-lg leading-relaxed drop-shadow-md">
          {beat.subtitle}
        </p>
      )}

      {beat.ctaLabel && beat.ctaHref && (
        <motion.a
          href={beat.ctaHref}
          className="pointer-events-auto mt-8 inline-flex items-center gap-3 border border-[#C9A84C] text-[#C9A84C] px-8 py-3.5 text-sm font-bold tracking-widest uppercase hover:bg-[#C9A84C] hover:text-black transition-colors duration-300"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          {beat.ctaLabel}
        </motion.a>
      )}
    </motion.div>
  );
}

export function CinematicShowcaseSection({
  frameSrc,
  frameCount,
  scrollHeight = '350vh',
  storyBeats,
  bgColor = '#0C0C0C',
}: Props) {
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

  // Ambient gold glow that intensifies in the middle
  const glowOpacity = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0, 0.6, 0.6, 0]);
  const glowScale   = useTransform(smoothProgress, [0, 0.5, 1], [0.7, 1.2, 0.8]);

  // Progress bar at bottom
  const barScaleX = useTransform(smoothProgress, [0, 1], [0, 1]);

  // Scroll indicator fades out after 8%
  const scrollHintOpacity = useTransform(smoothProgress, [0, 0.08], [1, 0]);

  // Canvas progress (raw 0-1 → used directly)
  const progressValue = scrollYProgress.get();

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
        {/* GPU-accelerated canvas layer */}
        <div className="absolute inset-0 will-change-transform" style={{ transform: 'translateZ(0)' }}>
          <FrameProgressBridge
            smoothProgress={smoothProgress}
            frameSrc={frameSrc}
            frameCount={frameCount}
          />
        </div>

        {/* Dark vignette edges */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/30 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/30 to-transparent" />
        </div>

        {/* Ambient gold glow */}
        <motion.div
          style={{ opacity: glowOpacity, scale: glowScale }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[50vw] h-[50vh] rounded-full bg-[#C9A84C]/20 blur-[100px]" />
        </motion.div>

        {/* Story beats (text overlays) */}
        {storyBeats.map((beat, i) => (
          <ScrollBeat key={i} beat={beat} scrollProgress={smoothProgress} />
        ))}

        {/* Top-left: EUROSTORE brand mark */}
        <div className="absolute top-8 right-8 text-[#C9A84C] text-xs font-bold tracking-[0.3em] uppercase opacity-70">
          EUROSTORE
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/10">
          <motion.div
            style={{ scaleX: barScaleX, transformOrigin: 'left' }}
            className="h-full bg-[#C9A84C] will-change-transform"
          />
        </div>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: scrollHintOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/50 text-xs uppercase tracking-widest font-medium">مرر للأسفل</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-px h-8 bg-[#C9A84C]/60"
          />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Bridge component: reads smoothProgress as a live value
 * and passes it to CanvasScrollSequence on every frame.
 */
function FrameProgressBridge({
  smoothProgress,
  frameSrc,
  frameCount,
}: {
  smoothProgress: ReturnType<typeof useSpring>;
  frameSrc: (i: number) => string;
  frameCount: number;
}) {
  const progressRef = useRef(0);

  // Sync motion value → ref on every frame
  smoothProgress.on('change', (v) => {
    progressRef.current = v;
  });

  return (
    <CanvasScrollSequence
      frameSrc={frameSrc}
      frameCount={frameCount}
      progress={progressRef.current}
      quality="high"
      className="absolute inset-0"
    />
  );
}
