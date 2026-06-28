"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function GlassmorphismHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Background Orbs Transformations (Parallax effect)
  const orb1Y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  const orb3Scale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);

  // Glass Panels Transformations to create a "flying through" depth effect
  // Glass 1 (Closest initially, fades out and scales up as you scroll past)
  const glass1Scale = useTransform(scrollYProgress, [0, 0.3], [1, 3]);
  const glass1Opacity = useTransform(scrollYProgress, [0, 0.25, 0.3], [1, 0.8, 0]);

  // Glass 2 (Middle layer, comes forward, then fades out)
  const glass2Scale = useTransform(scrollYProgress, [0, 0.3, 0.6], [0.5, 1, 3]);
  const glass2Opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.6], [0, 1, 1, 0]);

  // Glass 3 (Farthest layer, comes forward to be the final frame)
  const glass3Scale = useTransform(scrollYProgress, [0, 0.6, 1], [0.2, 0.8, 1]);
  const glass3Opacity = useTransform(scrollYProgress, [0, 0.5, 0.8], [0, 0, 1]);

  // Text Animations mapped to the layers
  const text1Opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const text1Y = useTransform(scrollYProgress, [0, 0.15], ["0%", "-50%"]);

  const text2Opacity = useTransform(scrollYProgress, [0.2, 0.3, 0.5], [0, 1, 0]);
  const text2Y = useTransform(scrollYProgress, [0.2, 0.5], ["50%", "-50%"]);

  const text3Opacity = useTransform(scrollYProgress, [0.7, 0.9], [0, 1]);
  const text3Y = useTransform(scrollYProgress, [0.7, 0.9], ["50%", "0%"]);

  return (
    <div ref={containerRef} className="relative h-[300vh] bg-[#0F0F0F] text-white">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Animated Background Orbs */}
        <motion.div 
          className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-fuchsia-600/30 rounded-full blur-[120px] mix-blend-screen"
          style={{ y: orb1Y }}
          animate={{
            x: ["-10%", "10%", "-10%"],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[10%] right-[10%] w-[50vw] h-[50vw] bg-[#C9A84C]/30 rounded-full blur-[140px] mix-blend-screen"
          style={{ y: orb2Y }}
          animate={{
            x: ["10%", "-10%", "10%"],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[35vw] h-[35vw] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"
          style={{ scale: orb3Scale }}
          animate={{
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />

        {/* ========================================================
            LAYER 1 (Initial state)
            ======================================================== */}
        <motion.div 
          className="absolute z-10 w-[90vw] md:w-[70vw] h-[60vh] rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col items-center justify-center overflow-hidden"
          style={{ scale: glass1Scale, opacity: glass1Opacity }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <motion.div 
            className="z-20 text-center px-4"
            style={{ opacity: text1Opacity, y: text1Y }}
          >
            <h1 className="text-5xl md:text-7xl font-playfair font-bold mb-4 drop-shadow-2xl text-white">
              يورو ستور
            </h1>
            <p className="text-lg md:text-2xl font-manrope text-white/80 max-w-xl mx-auto">
              مستقبل الأناقة الأوروبية بين يديك. تجربة تسوق زجاجية شفافة.
            </p>
          </motion.div>
        </motion.div>


        {/* ========================================================
            LAYER 2 (Middle state)
            ======================================================== */}
        <motion.div 
          className="absolute z-20 w-[80vw] md:w-[60vw] h-[55vh] rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col items-center justify-center overflow-hidden"
          style={{ scale: glass2Scale, opacity: glass2Opacity }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
          <div className="absolute inset-4 border border-white/10 rounded-[1.5rem] pointer-events-none" />
          
          <motion.div 
            className="z-30 text-center px-4"
            style={{ opacity: text2Opacity, y: text2Y }}
          >
            <h2 className="text-4xl md:text-6xl font-playfair font-bold mb-4 text-[#E8D28A]">
              شفافية مطلقة
            </h2>
            <p className="text-lg md:text-xl font-manrope text-white/90 max-w-lg mx-auto">
              اكتشف طبقات من الجمال والفخامة من خلال تصميم يعكس رقي اختياراتك. كل تفصيل مصمم بعناية.
            </p>
          </motion.div>
        </motion.div>


        {/* ========================================================
            LAYER 3 (Final state)
            ======================================================== */}
        <motion.div 
          className="absolute z-30 w-[95vw] md:w-[80vw] h-[70vh] rounded-[2rem] border border-[#C9A84C]/30 bg-white/5 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col items-center justify-center overflow-hidden"
          style={{ scale: glass3Scale, opacity: glass3Opacity }}
        >
          <div className="absolute inset-0 bg-gradient-to-bl from-white/20 via-white/5 to-transparent pointer-events-none" />
          
          <motion.div 
            className="z-40 flex flex-col items-center text-center px-4"
            style={{ opacity: text3Opacity, y: text3Y }}
          >
            <div className="w-24 h-24 mb-8 rounded-full border border-[#C9A84C]/50 bg-[#C9A84C]/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              <span className="text-[#E8D28A] font-playfair text-3xl font-bold">ES</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-playfair font-bold mb-6 text-white drop-shadow-lg">
              ابدأ رحلتك
            </h2>
            <button className="px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-manrope font-semibold text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
              تصفح التشكيلة الجديدة
            </button>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
