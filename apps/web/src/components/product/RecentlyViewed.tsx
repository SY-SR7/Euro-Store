'use client';
import React, { useEffect, useState } from 'react';
import { useRecentStore } from '@/lib/recentStore';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';

export function RecentlyViewed() {
  const { items } = useRecentStore();
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const isAr = locale === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  return (
    <div className='w-full py-12 border-t border-border/50'>
      <div className='max-w-7xl mx-auto px-4'>
        <h3 className='text-2xl font-black mb-8 text-text-primary text-center uppercase tracking-wider'>
          {isAr ? '?????? ??????? ??????' : 'Recently Viewed'}
        </h3>
        <div className='flex overflow-x-auto gap-6 pb-6 snap-x hide-scrollbar'>
          {items.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ y: -5 }}
              className='snap-start shrink-0 w-48 group'
            >
              <Link href={\/products/\\} className='block'>
                <div className='relative aspect-[4/5] rounded-xl overflow-hidden bg-background-secondary mb-3 border border-border/50 group-hover:border-primary/30 transition-colors'>
                  <Image
                    src={item.imageUrl || 'https://via.placeholder.com/200'}
                    alt={isAr ? item.nameAr : item.nameEn}
                    fill
                    className='object-cover group-hover:scale-105 transition-transform duration-500'
                  />
                </div>
                <p className='text-xs font-bold text-text-muted uppercase tracking-widest mb-1'>{item.brandName || 'EuroStore'}</p>
                <p className='text-sm font-semibold text-text-primary line-clamp-1 group-hover:text-primary transition-colors'>{isAr ? item.nameAr : item.nameEn}</p>
                <p className='text-sm font-black text-primary mt-1'>{item.priceSyp.toLocaleString('ar-SY')} ?.?</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

