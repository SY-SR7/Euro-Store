'use client';

import React from 'react';
import { ShieldCheck, Truck, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function TrustPillars({ isAr = true }: { isAr?: boolean }) {
  const pillars = [
    {
      icon: ShieldCheck,
      titleAr: 'منتجات أصلية 100%',
      titleEn: '100% Authentic Products',
      descAr: 'مستوردة مباشرة من الوكلاء الرسميين في أوروبا',
      descEn: 'Directly sourced from official brands in Europe',
    },
    {
      icon: Truck,
      titleAr: 'توصيل سريع وآمن',
      titleEn: 'Fast & Secure Delivery',
      descAr: 'تغليف فاخر وشحن موثوق لكافة المحافظات',
      descEn: 'Premium luxury packaging & safe shipping',
    },
    {
      icon: Sparkles,
      titleAr: 'برنامج الولاء والمكافآت',
      titleEn: 'VIP Loyalty Rewards',
      descAr: 'اكسب نقاطاً نقدية مع كل عملية شراء واستبدلها',
      descEn: 'Earn redeemable cash points on every order',
    },
    {
      icon: RefreshCw,
      titleAr: 'استبدال واسترجاع مضمون',
      titleEn: 'Guaranteed Exchange',
      descAr: 'مرونة تامة لضمان رضاك واختيار مقاسك المثالي',
      descEn: 'Complete flexibility for perfect sizing & satisfaction',
    },
  ];

  return (
    <section className="border-y border-border/60 bg-background-card/40 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex items-center gap-3.5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-text-primary">
                    {isAr ? item.titleAr : item.titleEn}
                  </h4>
                  <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
