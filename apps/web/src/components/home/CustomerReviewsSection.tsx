'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, CheckCircle } from 'lucide-react';

export function CustomerReviewsSection({ isAr = true }: { isAr?: boolean }) {
  const reviews = [
    {
      nameAr: 'طارق العمر',
      nameEn: 'Tariq Al-Omar',
      cityAr: 'دمشق',
      cityEn: 'Damascus',
      productAr: 'حذاء Adidas Samba OG',
      productEn: 'Adidas Samba OG Sneaker',
      rating: 5,
      commentAr:
        'الحذاء أصلي 100% كما هو معروض في متجر أديداس بألمانيا تماماً، والتغليف راقٍ جداً والمقاس دقيق. تجربة ممتازة وسأكرر الشراء بالتأكيد.',
      commentEn:
        '100% authentic sneaker exactly like European stores. Premium luxury packaging and spot-on sizing. Highly recommended!',
    },
    {
      nameAr: 'ريم خليل',
      nameEn: 'Reem Khalil',
      cityAr: 'حلب',
      cityEn: 'Aleppo',
      productAr: 'عطر Dior Sauvage EDP',
      productEn: 'Dior Sauvage EDP 100ml',
      rating: 5,
      commentAr:
        'العطر فواح وثباته مذهل وأصلي مع الباركود وكود التشغيلة. خدمة التوصيل كانت سريعة وفريق الدعم متعاون جداً.',
      commentEn:
        'Original perfume with batch code and incredible longevity. Fast delivery and extremely helpful support team.',
    },
    {
      nameAr: 'حسام ديب',
      nameEn: 'Houssam Deeb',
      cityAr: 'اللاذقية',
      cityEn: 'Latakia',
      productAr: 'قميص بولو Lacoste L.12.12',
      productEn: 'Lacoste L.12.12 Polo Shirt',
      rating: 5,
      commentAr:
        'الخامة القطنية البيكيه ممتازة والألوان غنية. نظام النقاط والمكافآت وفّر لي خصماً ممتازاً على طلبي الثاني.',
      commentEn:
        'Exceptional piqué cotton quality and rich colors. The loyalty cashback points gave me a great discount on my next order.',
    },
  ];

  return (
    <section className="border-t border-border/80 bg-background px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-3">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span>{isAr ? 'تقييمات وتجارب العملاء' : 'Verified Reviews'}</span>
          </div>
          <h2 className="text-2xl font-black text-text-primary md:text-4xl">
            {isAr ? 'ماذا يقول عملاؤنا عن يورو ستور؟' : 'What Our Customers Say'}
          </h2>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((rev, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
              className="relative flex flex-col justify-between rounded-3xl border border-border/70 bg-background-card p-8 shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <div>
                {/* Rating Stars & Quote Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="h-6 w-6 text-primary/30 rotate-180" />
                </div>

                <p className="text-sm leading-relaxed text-text-secondary italic">
                  "{isAr ? rev.commentAr : rev.commentEn}"
                </p>
              </div>

              <div className="mt-6 border-t border-border/50 pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-text-primary flex items-center gap-1.5">
                    <span>{isAr ? rev.nameAr : rev.nameEn}</span>
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  </h4>
                  <p className="text-xs text-text-muted">
                    {isAr ? rev.cityAr : rev.cityEn} •{' '}
                    <span className="text-primary">{isAr ? rev.productAr : rev.productEn}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
