'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// ─── Easing curves ─────────────────────────────────────────────────────────
const smooth    = [0.22, 1, 0.36, 1] as const;
const springy   = [0.34, 1.56, 0.64, 1] as const;

// ─── Animation variants ─────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: smooth, delay },
  }),
};

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: springy, delay },
  }),
};

/**
 * HeroSection — Full-screen image background with animated overlaid content.
 */
export function HeroSection() {
  const prefersReduced = useReducedMotion();
  const t = useTranslations('home.hero');
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative h-screen w-full overflow-hidden flex items-center justify-center"
      dir="rtl"
    >
      {/* ── Background Video with subtle zoom & parallax ── */}
      <motion.video
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
        style={{ y: prefersReduced ? 0 : y }}
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        src="/videos/385198338_fb_trim.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* ── Dark cinematic overlay with radial shading behind text ── */}
      <div
        className="absolute inset-0 bg-black/50 sm:bg-transparent"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col justify-center px-6 max-w-7xl mx-auto w-full h-full pt-20">
        <div className="max-w-3xl">
          {/* Pre-title label */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="text-[10px] md:text-xs font-bold tracking-[0.5em] uppercase mb-8 opacity-90"
            style={{ color: '#E8D28A' }}
          >
            {t('collection')} — 2025
          </motion.p>

          {/* Main headline — Editorial Oversized */}
          <motion.h1
            className="text-6xl md:text-8xl lg:text-[9rem] font-headline font-black leading-[0.95] tracking-tight mb-8"
            style={{ 
              color: '#FFFFFF',
              textShadow: '0px 10px 30px rgba(0, 0, 0, 0.4)'
            }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: prefersReduced ? 0 : 0.1, delayChildren: 0.3 } },
            }}
          >
            {(t.raw('words') || ['يُرتدى', 'بأناقة،', 'يُعاش', 'بثقة']).map((word: string, i: number) => (
              <motion.span
                key={i}
                variants={{
                  hidden:  { opacity: 0, y: '100%', rotate: 5 },
                  visible: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.9, ease: smooth } },
                }}
                className="inline-block me-4 lg:me-6 origin-bottom-left"
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.7}
            className="text-sm md:text-lg max-w-md leading-relaxed mb-12 font-medium opacity-80"
            style={{ color: '#F3EEE3' }}
          >
            {t('subtitle')}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1.0}
            className="flex flex-wrap gap-6 items-center"
          >
            {/* Primary CTA */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-3 px-8 md:px-12 py-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 rounded-none bg-white text-black hover:bg-[#E8D28A]"
              >
                {t('shopNow')}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>

            {/* Secondary CTA */}
            <motion.div
              whileHover={{ x: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white hover:text-[#E8D28A] transition-colors border-b border-transparent hover:border-[#E8D28A] pb-1"
              >
                {t('explore')}
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats row - Moved to bottom right on desktop */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          custom={1.3}
          className="absolute bottom-10 rtl:left-10 ltr:right-10 hidden lg:flex flex-col gap-10 border-l border-white/20 pl-8"
        >
          {[
            { num: '+500', label: t('stats.exclusive') },
            { num: '+10k', label: t('stats.customers') },
            { num: t('stats.categoriesNum'), label: t('stats.categories') },
          ].map(({ num, label }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-3xl font-headline font-black text-white">{num}</span>
              <span className="text-[10px] font-bold tracking-widest text-[#E8D28A] uppercase">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none drop-shadow-lg"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('scrollDown')}</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-px h-10"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)' }}
        />
      </motion.div>
    </section>
  );
}
