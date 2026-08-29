'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface CategoryBentoShowcaseProps {
  isAr?: boolean;
}

export function CategoryBentoShowcase({ isAr = true }: CategoryBentoShowcaseProps) {
  const categories = [
    {
      slug: 'footwear',
      titleAr: 'سنيكرز وأحذية رياضية',
      titleEn: 'Luxury Sneakers & Footwear',
      subtitleAr: 'أديداس، نايك، نيو بالانس، بوما، كونفرس',
      subtitleEn: 'Adidas, Nike, New Balance, Puma, Converse',
      image: 'https://m.media-amazon.com/images/I/71M4f912LrL._AC_SL1500_.jpg',
      badgeAr: 'الأكثر طلباً',
      badgeEn: 'Best Seller',
      gridClass: 'col-span-12 md:col-span-8 lg:col-span-6 min-h-[280px]',
      bgTint: 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF6ED] to-[#F5EFE0]',
      badgeBg: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
    },
    {
      slug: 'perfumes-beauty',
      titleAr: 'عطور عالمية فاخرة',
      titleEn: 'Iconic Luxury Fragrances',
      subtitleAr: 'ديور، شانيل، فرزاتشي، برادا، غوتشي',
      subtitleEn: 'Dior, Chanel, Versace, Prada, Gucci',
      image: 'https://m.media-amazon.com/images/I/51Hxl7J1jzL._AC_SL1500_.jpg',
      badgeAr: 'أصلية 100%',
      badgeEn: '100% Authentic',
      gridClass: 'col-span-12 md:col-span-4 lg:col-span-6 min-h-[280px]',
      bgTint: 'bg-gradient-to-br from-[#FFFDF9] via-[#F6F4F0] to-[#EBE7DF]',
      badgeBg: 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]',
    },
    {
      slug: 'mens',
      titleAr: 'أزياء وقمصان بولو',
      titleEn: 'Classic Apparel & Polos',
      subtitleAr: 'لاكوست، تومي هيلفيغر، رالف لورين، بوس',
      subtitleEn: 'Lacoste, Tommy Hilfiger, Ralph Lauren, Boss',
      image: 'https://m.media-amazon.com/images/I/61++oCXypXL._AC_SL1500_.jpg',
      badgeAr: 'تشكيلة راقية',
      badgeEn: 'Premium Fit',
      gridClass: 'col-span-12 sm:col-span-6 lg:col-span-4 min-h-[250px]',
      bgTint: 'bg-gradient-to-br from-[#FFFDF9] via-[#F4F8F5] to-[#E6EFEA]',
      badgeBg: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
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
      gridClass: 'col-span-12 sm:col-span-6 lg:col-span-4 min-h-[250px]',
      bgTint: 'bg-gradient-to-br from-[#FFFDF9] via-[#F8F5FB] to-[#EEE5F7]',
      badgeBg: 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]',
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
      gridClass: 'col-span-12 sm:col-span-12 lg:col-span-4 min-h-[250px]',
      bgTint: 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#F2EADB]',
      badgeBg: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    },
  ];

  return (
    <section className="bg-background px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <span>{isAr ? 'تصفح التشكيلات' : 'Explore Collections'}</span>
            </div>
            <h2 className="text-2xl font-black text-[#1F1B16] md:text-4xl">
              {isAr ? 'تسوق حسب الأقسام الفاخرة' : 'Shop By Luxury Categories'}
            </h2>
            <p className="mt-1 text-xs md:text-sm text-[#6F6658]">
              {isAr
                ? 'استكشف كافة المجموعات الأصلية عبر التصنيفات المعتمدة'
                : 'Browse all authentic collections by department'}
            </p>
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
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className={`group relative overflow-hidden rounded-2xl border border-[#E8DFC8] ${cat.bgTint} shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md ${cat.gridClass}`}
            >
              <Link href={`/categories/${cat.slug}`} className="absolute inset-0 z-20" />

              {/* Product Image Frame */}
              <div className="absolute end-4 top-1/2 -translate-y-1/2 h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 transition-transform duration-500 ease-out group-hover:scale-108">
                <div className="relative h-full w-full rounded-2xl bg-white p-3 shadow-sm border border-[#E8DFC8]/60 flex items-center justify-center">
                  <img
                    src={cat.image}
                    alt={cat.titleAr}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-7 max-w-[62%]">
                <div>
                  <span className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-black border mb-2.5 ${cat.badgeBg}`}>
                    {isAr ? cat.badgeAr : cat.badgeEn}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#1F1B16] leading-tight group-hover:text-primary transition-colors">
                    {isAr ? cat.titleAr : cat.titleEn}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#6F6658] line-clamp-2 leading-relaxed">
                    {isAr ? cat.subtitleAr : cat.subtitleEn}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary group-hover:underline">
                  <span>{isAr ? 'تصفح القسم' : 'Shop Now'}</span>
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
