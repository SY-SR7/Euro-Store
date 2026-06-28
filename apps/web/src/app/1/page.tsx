"use client";

import { useRef } from "react";
import { useScroll, useTransform, motion, useSpring } from "framer-motion";

export default function Design1Page() {
  const heroContainerRef = useRef<HTMLDivElement>(null);

  // Smooth the scroll progress for the hero
  const { scrollYProgress } = useScroll({
    target: heroContainerRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Storyboard transforms
  const productY = useTransform(smoothProgress, [0, 0.5, 1], ["0%", "-15%", "-35%"]);
  const productScale = useTransform(smoothProgress, [0, 0.25, 0.75, 1], [1, 1.08, 1.12, 0.95]);
  const productOpacity = useTransform(smoothProgress, [0, 0.8, 1], [1, 1, 0]);

  const headlineY = useTransform(smoothProgress, [0, 0.15, 0.8, 1], ["30px", "0px", "-20px", "-40px"]);
  const headlineOpacity = useTransform(smoothProgress, [0, 0.15, 0.75, 0.95], [0, 1, 1, 0]);

  const subOpacity = useTransform(smoothProgress, [0.05, 0.2, 0.75, 0.95], [0, 1, 1, 0]);
  const subY = useTransform(smoothProgress, [0.05, 0.2], ["20px", "0px"]);

  const ctaOpacity = useTransform(smoothProgress, [0.2, 0.35, 0.75, 0.95], [0, 1, 1, 0]);
  const ctaScale = useTransform(smoothProgress, [0.2, 0.35], [0.9, 1]);

  const glowOpacity = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0.3, 0.8, 0.6, 0]);
  const glowScale = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1.3, 1]);

  const bgY = useTransform(smoothProgress, [0, 1], ["0%", "25%"]);

  // Variants for scroll-reactive sections
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  const tiltVariants = {
    rest: { rotateX: 0, rotateY: 0, scale: 1 },
    hover: { scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 20 } },
  };

  const mockProducts = [
    { id: 1, name: "فستان سهرة كلاسيكي", brand: "VOGUE", price: "450,000", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80" },
    { id: 2, name: "حقيبة يد فاخرة", brand: "ELEGANCE", price: "220,000", image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80" },
    { id: 3, name: "حذاء كعب عالي", brand: "MILANO", price: "185,000", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80" },
    { id: 4, name: "نظارات شمسية ذهبية", brand: "AURA", price: "120,000", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80" },
  ];

  return (
    <div className="bg-[#121414] min-h-screen text-[#E2E2E2] selection:bg-[#C9A84C] selection:text-[#121414] overflow-x-hidden">
      
      {/* Cinematic Hero Sequence */}
      <div ref={heroContainerRef} className="relative h-[300vh]">
        <div className="sticky top-0 h-screen overflow-hidden bg-[#0C0F0F] flex items-center justify-center">
          
          {/* Background Layer */}
          <motion.div
            style={{ y: bgY }}
            className="absolute inset-0 bg-gradient-to-b from-[#0C0F0F] via-[#121414] to-[#1A1C1C]"
          />

          {/* Ambient Glow */}
          <motion.div
            style={{ opacity: glowOpacity, scale: glowScale }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-[600px] h-[600px] rounded-full bg-[#C9A84C]/20 blur-[120px]" />
          </motion.div>

          {/* Product Image */}
          <motion.div
            style={{ y: productY, scale: productScale, opacity: productOpacity }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Using a placeholder image for the hero */}
            <div className="relative w-full max-w-2xl aspect-square">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
                alt="Luxury Fashion"
                className="w-full h-full object-cover rounded-full drop-shadow-[0_20px_50px_rgba(201,168,76,0.15)] mask-image-[radial-gradient(ellipse_at_center,black_50%,transparent_100%)]"
                style={{ WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)' }}
              />
            </div>
          </motion.div>

          {/* Text Layer */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none z-10">
            <motion.h1
              style={{ y: headlineY, opacity: headlineOpacity }}
              className="text-5xl lg:text-7xl font-bold text-[#E2E2E2] mb-4 leading-tight drop-shadow-xl font-serif"
            >
              يُرتدى بأناقة
            </motion.h1>

            <motion.p
              style={{ y: subY, opacity: subOpacity }}
              className="text-[#9CA3AF] text-lg lg:text-xl max-w-xl mb-8 drop-shadow-md"
            >
              أزياء أوروبية راقية تصلك إلى سوريا. اختبري فخامة التصميم وجاذبية الحضور.
            </motion.p>

            <motion.div
              style={{ opacity: ctaOpacity, scale: ctaScale }}
              className="pointer-events-auto"
            >
              <button className="bg-[#C9A84C] text-[#1A1A1A] px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-[#A67C2E] active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:shadow-[0_0_30px_rgba(201,168,76,0.5)]">
                تسوقي المجموعة
              </button>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            style={{ opacity: useTransform(smoothProgress, [0, 0.1], [1, 0]) }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
          >
            <span className="text-[#9CA3AF] text-xs uppercase tracking-widest">مرر للأسفل</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-0.5 h-8 bg-[#C9A84C]/50"
            />
          </motion.div>
        </div>
      </div>

      {/* New Arrivals Section */}
      <section className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 relative z-20 bg-[#121414]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center mb-16"
        >
          <span className="text-[#C9A84C] text-xs uppercase tracking-widest mb-3">وصل حديثاً</span>
          <h2 className="text-3xl md:text-4xl font-serif text-[#E2E2E2]">أحدث التشكيلات</h2>
          <div className="w-12 h-0.5 bg-[#2E2E2E] mt-6" />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {mockProducts.map((product) => (
            <motion.div
              key={product.id}
              variants={fadeUpVariants}
              className="group relative bg-[#1E2020] rounded-md overflow-hidden border border-[#2E2E2E] hover:border-[#C9A84C]/30 transition-all duration-500 cursor-pointer"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <motion.div
                  variants={tiltVariants}
                  initial="rest"
                  whileHover="hover"
                  style={{ transformStyle: "preserve-3d" }}
                  className="w-full h-full"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700"
                  />
                </motion.div>
                <span className="absolute top-3 start-3 bg-[#C9A84C] text-[#1A1A1A] text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider shadow-lg">
                  جديد
                </span>
              </div>
              <div className="p-5 text-center bg-gradient-to-t from-[#1A1C1C] to-[#1E2020]">
                <p className="text-[#9CA3AF] text-xs uppercase tracking-widest mb-2">{product.brand}</p>
                <h3 className="text-[#E2E2E2] font-medium line-clamp-1 mb-2 group-hover:text-[#C9A84C] transition-colors">{product.name}</h3>
                <p className="text-[#C9A84C] font-semibold">{product.price} ل.س</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <div className="mt-16 text-center">
           <button className="border border-[#C9A84C] text-[#C9A84C] px-8 py-3 rounded-sm hover:bg-[#C9A84C]/10 transition-colors text-sm font-medium uppercase tracking-widest">
            عرض الكل
          </button>
        </div>
      </section>

      {/* Featured Collection - Parallax */}
      <section className="relative py-24 overflow-hidden border-t border-[#2E2E2E]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-start"
            >
              <h2 className="text-4xl lg:text-5xl font-serif mb-6 leading-tight">مجموعة <span className="text-[#C9A84C]">Aura</span> الخريفية</h2>
              <p className="text-[#9CA3AF] text-lg leading-relaxed mb-8">
                اكتشفي التفاصيل الدقيقة والأقمشة الفاخرة التي تجسد جوهر الأناقة. تصميمات صُنعت بعناية لتبرز جمالك في كل مناسبة.
              </p>
              <button className="text-[#C9A84C] text-sm font-bold uppercase tracking-widest hover:underline underline-offset-4 flex items-center gap-2">
                اكتشفي المزيد
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </motion.div>

            <div className="relative h-[600px] w-full rounded-md overflow-hidden">
              <motion.div
                initial={{ scale: 1.1 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <img 
                  src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80" 
                  alt="Featured Collection" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-transparent to-transparent opacity-80" />
              </motion.div>
            </div>
            
          </div>
        </div>
      </section>

    </div>
  );
}
