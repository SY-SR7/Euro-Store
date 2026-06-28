"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Star, ArrowDown } from "lucide-react";

export default function BrutalistDesign() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scroll driven animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Apply spring for that snappy, rigid brutalist motion
  const springConfig = { stiffness: 100, damping: 30, bounce: 0 };
  const smoothProgress = useSpring(scrollYProgress, springConfig);

  const titleY = useTransform(smoothProgress, [0, 1], ["0%", "80%"]);
  const block1Y = useTransform(smoothProgress, [0, 1], ["0%", "-40%"]);
  const block2Y = useTransform(smoothProgress, [0, 1], ["0%", "-80%"]);
  const block3Y = useTransform(smoothProgress, [0, 1], ["0%", "-120%"]);
  const bgColors = useTransform(
    smoothProgress,
    [0, 0.5, 1],
    ["#ff00ff", "#00ffff", "#c0ff00"]
  );

  return (
    <main className="min-h-screen text-black font-sans selection:bg-black selection:text-[#c0ff00] bg-white overflow-x-hidden" dir="rtl">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="text-4xl font-black tracking-tighter uppercase">
            يورو<span className="text-[#C9A84C]">ستور</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-black text-xl uppercase">
            <Link href="#" className="hover:bg-black hover:text-[#c0ff00] px-2 py-1 transition-colors border-2 border-transparent hover:border-black">تسوق الآن</Link>
            <Link href="#" className="hover:bg-black hover:text-[#ff00ff] px-2 py-1 transition-colors border-2 border-transparent hover:border-black">المجموعات</Link>
            <Link href="#" className="hover:bg-black hover:text-[#00ffff] px-2 py-1 transition-colors border-2 border-transparent hover:border-black">العروض</Link>
          </div>
          <div className="w-14 h-14 bg-[#c0ff00] border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
            <ShoppingBag className="w-7 h-7 stroke-[3]" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        ref={containerRef} 
        style={{ backgroundColor: bgColors }}
        className="relative pt-32 pb-20 px-4 md:px-8 min-h-screen flex flex-col justify-center border-b-4 border-black overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #000 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          <motion.div 
            className="lg:col-span-7 flex flex-col justify-center relative z-20"
            style={{ y: titleY }}
          >
            <motion.div
              initial={{ opacity: 0, x: 100, rotate: -5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="inline-block"
            >
              <h1 className="text-7xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter">
                <span className="bg-white px-2 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] inline-block mb-4">
                  أزياء
                </span>
                <br />
                <span className="text-black drop-shadow-[6px_6px_0_#fff]">
                  لا تعرف
                </span>
                <br />
                <span className="bg-black text-white px-2 border-4 border-black shadow-[8px_8px_0_0_#c0ff00] inline-block mt-4">
                  القيود.
                </span>
              </h1>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
              className="mt-12 text-2xl font-bold max-w-xl bg-white text-black p-6 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
            >
              اكتشف أحدث صيحات الموضة التي تكسر القواعد. يورو ستور يقدم لك الجرأة في كل تفصيل، مصممة خصيصاً للشارع السوري.
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 500, damping: 20 }}
              className="mt-12 flex flex-wrap gap-6"
            >
              <button className="bg-[#c0ff00] text-black text-2xl font-black uppercase px-10 py-5 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all flex items-center gap-4 group">
                تسوق التشكيلة <ArrowLeft className="w-8 h-8 stroke-[4] group-hover:-translate-x-2 transition-transform" />
              </button>
              <button className="bg-white text-black text-2xl font-black uppercase px-8 py-5 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all flex items-center justify-center">
                <ArrowDown className="w-8 h-8 stroke-[4] animate-bounce" />
              </button>
            </motion.div>
          </motion.div>

          {/* Staggered Floating Blocks (Cinematic Scroll Sequence) */}
          <div className="lg:col-span-5 relative min-h-[600px] mt-16 lg:mt-0">
            <motion.div 
              style={{ y: block1Y }}
              initial={{ y: 200, opacity: 0, rotate: 10 }}
              animate={{ y: 0, opacity: 1, rotate: 6 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              className="absolute top-0 start-4 lg:start-auto lg:end-0 w-[280px] h-[360px] bg-white border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-4 flex flex-col justify-between z-20"
            >
              <div className="w-full h-56 bg-gray-200 border-4 border-black relative overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1550614000-4b95dd2dbef0?q=80&w=800&auto=format&fit=crop" alt="Fashion 1" className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-300" />
              </div>
              <div className="flex justify-between items-end mt-4">
                <span className="text-4xl font-black uppercase">جديد</span>
                <span className="text-xl font-black bg-[#ff00ff] text-white px-3 py-1 border-4 border-black">99,000 ل.س</span>
              </div>
            </motion.div>

            <motion.div 
              style={{ y: block2Y }}
              initial={{ x: -200, opacity: 0, rotate: -15 }}
              animate={{ x: 0, opacity: 1, rotate: -8 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
              className="absolute top-48 end-8 lg:end-auto lg:start-0 w-[240px] h-[320px] bg-[#00ffff] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-4 flex flex-col justify-between z-10"
            >
              <div className="w-full h-48 bg-gray-200 border-4 border-black relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop" alt="Fashion 2" className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-300" />
              </div>
              <div className="flex justify-between items-end mt-4">
                <span className="text-3xl font-black uppercase">تريند</span>
                <Star className="w-10 h-10 fill-white stroke-black stroke-[2]" />
              </div>
            </motion.div>

            <motion.div 
              style={{ y: block3Y }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 12 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 15 }}
              className="absolute bottom-[-50px] start-1/2 -translate-x-1/2 lg:translate-x-0 lg:start-24 w-48 h-48 bg-black text-white border-4 border-black shadow-[12px_12px_0_0_#c0ff00] p-4 flex items-center justify-center z-30"
            >
              <span className="text-5xl font-black text-center uppercase leading-none mix-blend-difference">
                كن<br/>مختلفاً
              </span>
            </motion.div>
          </div>

        </div>
      </motion.section>

      {/* Marquee Banner */}
      <div className="w-full overflow-hidden border-b-4 border-black bg-black text-white py-6 relative z-20">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] rtl:animate-[marquee-rtl_20s_linear_infinite]">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="text-4xl font-black uppercase mx-8 flex items-center gap-6">
              <Star className="w-8 h-8 fill-[#c0ff00] text-[#c0ff00]" /> يورو ستور 
              <Star className="w-8 h-8 fill-[#ff00ff] text-[#ff00ff]" /> أزياء الشارع
              <Star className="w-8 h-8 fill-[#00ffff] text-[#00ffff]" /> خصم ٢٠٪ 
            </span>
          ))}
        </div>
      </div>

      {/* Grid Categories */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-32">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b-8 border-black pb-8">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter">التصنيفات</h2>
          <Link href="#" className="text-2xl font-black uppercase hover:bg-black hover:text-[#c0ff00] px-4 py-2 border-4 border-black transition-colors mt-8 md:mt-0 inline-flex items-center gap-2">
            عرض الكل <ArrowLeft className="w-6 h-6 stroke-[4]" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {[
            { title: "رجالي", color: "bg-[#ff00ff]", img: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=600&auto=format&fit=crop" },
            { title: "نسائي", color: "bg-[#00ffff]", img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop" },
            { title: "أحذية", color: "bg-[#c0ff00]", img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=600&auto=format&fit=crop" },
          ].map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 300, damping: 25 }}
              className={`group relative h-[450px] ${cat.color} border-4 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] hover:translate-x-3 hover:translate-y-3 hover:shadow-none transition-all cursor-pointer p-6 flex flex-col justify-between`}
            >
              <div className="w-full h-[60%] border-4 border-black bg-white overflow-hidden">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500" />
              </div>
              <div className="flex justify-between items-end mt-4">
                <h3 className="text-6xl font-black uppercase">{cat.title}</h3>
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                  <ArrowLeft className="w-8 h-8 text-white stroke-[3]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Banner */}
      <section className="border-y-4 border-black bg-white overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-12 md:p-24 flex flex-col justify-center border-b-4 md:border-b-0 md:border-l-4 border-black relative">
            <div className="absolute top-8 start-8 text-8xl font-black text-gray-200 opacity-50 select-none -z-10">01</div>
            <h2 className="text-6xl md:text-8xl font-black uppercase leading-none mb-8">
              لا تتبع<br/>القطيع.
            </h2>
            <p className="text-2xl font-bold mb-12 max-w-md">
              تشكيلة حصرية من أزياء الشارع المصممة للمتمردين وعشاق الاختلاف.
            </p>
            <button className="bg-black text-white text-2xl font-black uppercase px-8 py-5 border-4 border-black shadow-[8px_8px_0_0_#ff00ff] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all self-start flex items-center gap-4">
              اكتشف المزيد <ArrowLeft className="w-8 h-8 stroke-[4]" />
            </button>
          </div>
          <div className="h-[500px] md:h-auto bg-[#c0ff00] relative p-8">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30"></div>
             <div className="w-full h-full border-4 border-black bg-white shadow-[16px_16px_0_0_rgba(0,0,0,1)] relative z-10 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop" alt="Featured" className="w-full h-full object-cover grayscale mix-blend-multiply hover:grayscale-0 transition-all duration-500" />
             </div>
          </div>
        </div>
      </section>

      {/* Custom Styles for Marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes marquee-rtl {
          0% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </main>
  );
}
