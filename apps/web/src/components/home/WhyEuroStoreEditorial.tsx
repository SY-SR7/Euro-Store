'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Gem, Gift, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function WhyEuroStoreEditorial({ isAr = true }: { isAr?: boolean }) {
  const cards = [
    {
      icon: ShieldCheck,
      titleAr: 'أصالة أوروبية 100% موثقة',
      titleEn: '100% Certified European Authenticity',
      descAr:
        'كل قطعة في متجرنا يتم جلبها مباشرة من المتاجر والوكلاء الرسميين في ألمانيا وأوروبا مع كود وتغليف المصنع الأصلي.',
      descEn:
        'Every single item is directly sourced from official retailers in Germany & Europe with original factory packaging.',
      tagAr: 'ضمان الجودة',
      tagEn: 'Quality Guarantee',
    },
    {
      icon: Gem,
      titleAr: 'برنامج الولاء ونقاط المكافآت',
      titleEn: 'VIP Loyalty & Cashback Points',
      descAr:
        'اكسب نقاطاً مالية مع كل عملية شراء واستبدلها بخصومات فورية مباشرة على طلباتك القادمة بدون أي تعقيد.',
      descEn:
        'Earn cash points on every purchase and redeem them instantly for direct discounts on your next orders.',
      tagAr: 'مكافآت فورية',
      tagEn: 'Instant Cashback',
    },
    {
      icon: Gift,
      titleAr: 'تغليف فاخر وشحن موثوق',
      titleEn: 'Luxury Unboxing & Express Delivery',
      descAr:
        'نهتم بأدق تفاصيل التغليف لتصلك مشترياتك في أبهى صورة مع إمكانية المعاينة والاستبدال السلس للمقاسات.',
      descEn:
        'Meticulous unboxing experience with safe express shipping and easy size exchange flexibility.',
      tagAr: 'تجربة مميزة',
      tagEn: 'Signature Experience',
    },
  ];

  return (
    <section className="relative overflow-hidden border-t border-border/80 bg-background-card/50 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span>{isAr ? 'معايير يورو ستور' : 'The EuroStore Standard'}</span>
          </div>
          <h2 className="text-3xl font-black text-text-primary md:text-5xl">
            {isAr ? 'تجربة التسوق الأوروبية الأولى' : 'The Premier European Shopping Experience'}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-text-secondary">
            {isAr
              ? 'نجمع لك أشهر الماركات العالمية تحت سقف واحد بأعلى معايير المصداقية والفخامة'
              : 'Bringing you the finest global brands under one roof with unmatched luxury & trust'}
          </p>
        </div>

        {/* 3 Editorial Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-background p-8 transition-all hover:border-primary/50 hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-sm group-hover:scale-110 transition-transform">
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="rounded-full bg-background-card px-3 py-1 text-[11px] font-bold text-text-secondary border border-border">
                      {isAr ? card.tagAr : card.tagEn}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-text-primary group-hover:text-primary transition-colors">
                    {isAr ? card.titleAr : card.titleEn}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {isAr ? card.descAr : card.descEn}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs font-bold text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isAr ? 'معتمد ومضمون 100%' : '100% Guaranteed'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
