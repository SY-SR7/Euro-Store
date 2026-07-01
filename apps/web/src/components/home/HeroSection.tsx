'use client';

import { motion, useReducedMotion } from 'framer-motion';
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

  return (
    <section
      id="hero"
      className="relative h-screen w-full overflow-hidden flex items-center justify-center"
      dir="rtl"
    >
      {/* ── Background Image with subtle zoom ── */}
      <motion.img
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full object-cover"
        src="/images/hero-bg.png"
        alt="Hero Background"
      />

      {/* ── Dark cinematic overlay with radial shading behind text ── */}
      <div
        className="absolute inset-0 bg-black/50 sm:bg-transparent"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full pt-10 drop-shadow-2xl">
        
        {/* Pre-title label */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-xs md:text-sm font-bold tracking-[0.4em] uppercase mb-5 opacity-90 drop-shadow-md"
          style={{ color: '#E8D28A' }}
        >
          {t('collection', { fallback: 'مجموعة ٢٠٢٥' })}
        </motion.p>

        {/* Main headline — word by word reveal */}
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6"
          style={{ 
            color: '#FFFFFF',
            textShadow: '0px 4px 20px rgba(0, 0, 0, 0.9)'
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
                hidden:  { opacity: 0, y: '0.6em' },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: smooth } },
              }}
              className="inline-block me-3"
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
          className="text-base md:text-xl max-w-xl leading-relaxed mb-10 font-medium"
          style={{ color: '#E2E2E2', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
        >
          {t('subtitle', { fallback: 'أزياء أوروبية راقية — من المصانع الأوروبية مباشرةً إلى يديك' })}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1.0}
          className="flex flex-wrap gap-4 justify-center"
        >
          {/* Primary CTA */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-10 py-4 text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity duration-300 rounded-full shadow-xl"
              style={{ background: 'linear-gradient(to right, #E8D28A, #C9A84C)', color: '#000' }}
            >
              {t('shopNow', { fallback: 'تسوق الآن' })}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rtl:rotate-180">
                <path d="M8 3L3 8L8 13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </motion.div>

          {/* Secondary CTA */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 border px-10 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 rounded-full bg-black/20 backdrop-blur-sm"
              style={{ borderColor: 'rgba(232, 210, 138, 0.4)', color: '#FFFFFF' }}
            >
              {t('explore', { fallback: 'استكشف الأقسام' })}
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          custom={1.3}
          className="mt-16 flex flex-wrap justify-center gap-10 md:gap-20 pt-10 w-full relative"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent opacity-50" />
          {[
            { num: '+500', label: t('stats.exclusive', { fallback: 'منتج حصري' }) },
            { num: '+10k', label: t('stats.customers', { fallback: 'زبون راضٍ' }) },
            { num: t('stats.categoriesNum', { fallback: '٤' }), label: t('stats.categories', { fallback: 'أقسام متنوعة' }) },
          ].map(({ num, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-3xl md:text-4xl font-black" style={{ color: '#E8D28A', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' }}>
                {num}
              </span>
              <span className="text-xs md:text-sm font-bold tracking-wider" style={{ color: '#E2E2E2', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{label}</span>
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
        <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('scrollDown', { fallback: 'مرر للأسفل' })}</span>
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
