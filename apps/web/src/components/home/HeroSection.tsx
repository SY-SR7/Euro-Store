'use client';

import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

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
 * HeroSection — Full-screen video background with animated overlaid content.
 * The video plays automatically, silently, in a loop showing a luxury boutique interior.
 * No scroll interaction needed — everything is visible at load time.
 */
export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative h-screen w-full overflow-hidden flex items-center justify-center"
      dir="rtl"
    >
      {/* ── Background Video ── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/boutique-hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/videos/boutique-hero-poster.jpg"
        aria-hidden="true"
      />

      {/* ── Dark cinematic overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(10,8,5,0.5) 50%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* ── Bottom gradient for smooth section merge ── */}
      <div
        className="absolute bottom-0 inset-x-0 pointer-events-none"
        style={{
          height: '30%',
          background: 'linear-gradient(to top, #0C0C0C 0%, transparent 100%)',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full">
        
        {/* Shaded Box / Frosted Glass container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: smooth }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full flex flex-col items-center"
        >
          {/* Pre-title label */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="text-[#C9A84C] text-xs md:text-sm font-bold tracking-[0.4em] uppercase mb-5 opacity-90"
          >
            مجموعة ٢٠٢٥
          </motion.p>

          {/* Main headline — word by word reveal */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6"
            style={{ 
              background: 'linear-gradient(135deg, #FFF 0%, #E8D28A 50%, #C9A84C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.4))'
            }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: prefersReduced ? 0 : 0.1, delayChildren: 0.3 } },
            }}
          >
            {['يُرتدى', 'بأناقة،', 'يُعاش', 'بثقة'].map((word, i) => (
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
            className="text-[#E2E2E2] text-base md:text-lg max-w-xl leading-relaxed mb-10 font-light"
          >
            أزياء أوروبية راقية — من المصانع الأوروبية مباشرةً إلى يديك
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#A67C2E] text-black px-8 py-4 text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity duration-300 rounded-xl shadow-lg"
              >
                تسوق الآن
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180">
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
                className="inline-flex items-center gap-2 border border-white/20 text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white/40 transition-all duration-300 rounded-xl"
              >
                استكشف الأقسام
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            custom={1.3}
            className="mt-12 flex flex-wrap justify-center gap-8 md:gap-14 border-t border-white/10 pt-8 w-full"
          >
            {[
              { num: '+500', label: 'منتج حصري' },
              { num: '+10k', label: 'زبون راضٍ' },
              { num: '٤', label: 'أقسام متنوعة' },
            ].map(({ num, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl md:text-3xl font-black text-[#C9A84C]">
                  {num}
                </span>
                <span className="text-white/60 text-xs md:text-sm font-medium tracking-wider">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-white/30 text-[10px] uppercase tracking-[0.25em]">مرر للأسفل</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-px h-10 bg-gradient-to-b from-white/60 to-transparent"
        />
      </motion.div>
    </section>
  );
}
