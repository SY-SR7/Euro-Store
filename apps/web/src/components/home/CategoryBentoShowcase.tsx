'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface CategoryBentoShowcaseProps {
  isAr?: boolean;
}

export function CategoryBentoShowcase({ isAr = true }: CategoryBentoShowcaseProps) {
  const categories = [
    {
      slug: 'footwear',
      titleAr: 'سنيكرز وأحذية رياضية فاخرة',
      titleEn: 'Luxury Sneakers & Footwear',
      subtitleAr: 'أديداس، نايك، نيو بالانس، بوما، كونفرس',
      subtitleEn: 'Adidas, Nike, New Balance, Puma, Converse',
      image: 'https://m.media-amazon.com/images/I/71M4f912LrL._AC_SL1500_.jpg',
      badgeAr: 'الأكثر شهرة',
      badgeEn: 'Best Seller',
      gridClass: 'col-span-12 md:col-span-8 lg:col-span-6 min-h-[300px]',
      gradient: 'from-amber-950/40 via-stone-900/60 to-black/80',
    },
    {
      slug: 'perfumes-beauty',
      titleAr: 'عطور باريسية وإيطالية فاخرة',
      titleEn: 'Iconic Luxury Fragrances',
      subtitleAr: 'ديور، شانيل، فرزاتشي، برادا، غوتشي',
      subtitleEn: 'Dior, Chanel, Versace, Prada, Gucci',
      image: 'https://m.media-amazon.com/images/I/51Hxl7J1jzL._AC_SL1500_.jpg',
      badgeAr: 'أصلية 100%',
      badgeEn: '100% Original',
      gridClass: 'col-span-12 md:col-span-4 lg:col-span-6 min-h-[300px]',
      gradient: 'from-blue-950/40 via-stone-900/60 to-black/80',
    },
    {
      slug: 'mens',
      titleAr: 'أزياء وقمصان بولو كلاسيك',
      titleEn: 'Classic Apparel & Polos',
      subtitleAr: 'لاكوست، تومي هيلفيغر، رالف لورين، بوس',
      subtitleEn: 'Lacoste, Tommy Hilfiger, Ralph Lauren, Boss',
      image: 'https://m.media-amazon.com/images/I/61++oCXypXL._AC_SL1500_.jpg',
      badgeAr: 'تشكيلة راقية',
      badgeEn: 'Premium Fit',
      gridClass: 'col-span-12 sm:col-span-6 lg:col-span-4 min-h-[260px]',
      gradient: 'from-emerald-950/40 via-stone-900/60 to-black/80',
    },
    {
      slug: 'watches-accessories',
      titleAr: 'ساعات ونظارات شمسية',
      titleEn: 'Watches & Sunglasses',
      subtitleAr: 'ريبان، كاسيو جي شوك، أحزمة جلدية',
      subtitleEn: 'Ray-Ban, Casio G-Shock, Leather Belts',
      image: 'https://m.media-amazon.com/images/I/61g6yHKxg0L._AC_SL1500_.jpg',
      badgeAr: 'إكسسوارات',
      badgeEn: 'Accessories',
      gridClass: 'col-span-12 sm:col-span-6 lg:col-span-4 min-h-[260px]',
      gradient: 'from-purple-950/40 via-stone-900/60 to-black/80',
    },
    {
      slug: 'bags-leather',
      titleAr: 'حقائب وجلديات فاخرة',
      titleEn: 'Luxury Handbags & Leather',
      subtitleAr: 'مايكل كورس، تومي، تشكيلة السفر والأناقة',
      subtitleEn: 'Michael Kors, Tommy Hilfiger, Travel & Luxury',
      image: 'https://m.media-amazon.com/images/I/71B1hp5wMAL._AC_SL1500_.jpg',
      badgeAr: 'فاخر',
      badgeEn: 'Luxury',
      gridClass: 'col-span-12 sm:col-span-12 lg:col-span-4 min-h-[260px]',
      gradient: 'from-amber-950/40 via-stone-900/60 to-black/80',
    },
  ];

  return (
    <section className="bg-background px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <span>{isAr ? 'تصفح التشكيلات' : 'Explore Collections'}</span>
            </div>
            <h2 className="text-2xl font-black text-text-primary md:text-4xl">
              {isAr ? 'تسوق حسب الأقسام الفاخرة' : 'Shop By Luxury Categories'}
            </h2>
          </div>
          <Link
            href="/categories"
            className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors"
          >
            <span>{isAr ? 'استعراض كافة الأقسام' : 'View All Categories'}</span>
            {isAr ? (
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            ) : (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            )}
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`group relative overflow-hidden rounded-3xl border border-border/80 bg-background-card transition-all hover:border-primary/50 hover:shadow-xl ${cat.gridClass}`}
            >
              <Link href={`/categories/${cat.slug}`} className="absolute inset-0 z-20" />

              {/* Background Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />

              {/* Product Image Frame */}
              <div className="absolute end-4 top-1/2 -translate-y-1/2 h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-2">
                <div className="relative h-full w-full rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur-sm border border-white/20">
                  <img
                    src={cat.image}
                    alt={cat.titleAr}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 max-w-[65%]">
                <div>
                  <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-[11px] font-black text-primary border border-primary/30 backdrop-blur-sm mb-3">
                    {isAr ? cat.badgeAr : cat.badgeEn}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-text-primary leading-tight group-hover:text-primary transition-colors">
                    {isAr ? cat.titleAr : cat.titleEn}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-text-secondary line-clamp-2">
                    {isAr ? cat.subtitleAr : cat.subtitleEn}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary group-hover:underline">
                  <span>{isAr ? 'تصفح المنتجات' : 'Shop Now'}</span>
                  {isAr ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
