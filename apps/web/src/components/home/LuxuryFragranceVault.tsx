'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Award } from 'lucide-react';
import { ProductCard } from '@/app/catalog-components';

interface LuxuryFragranceVaultProps {
  products: any[];
  isAr?: boolean;
}

export function LuxuryFragranceVault({ products, isAr = true }: LuxuryFragranceVaultProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-primary/20 bg-gradient-to-b from-[#14120E] via-[#1A1712] to-background px-4 py-16 md:px-8 md:py-24">
      {/* Background Decorative Gold Light */}
      <div className="pointer-events-none absolute -top-40 start-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-primary/15 pb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-2">
              <Award className="h-4 w-4 text-primary" />
              <span>{isAr ? 'عطور النخبة الأوروبية' : 'Haute Parfumerie'}</span>
            </div>
            <h2 className="text-2xl font-black text-text-primary md:text-4xl">
              {isAr ? 'جناح العطور العالمية الفاخرة والأصلية' : 'Authentic Luxury Fragrances'}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {isAr
                ? 'ديور، شانيل، فرزاتشي، برادا، وغوتشي — عبق الفخامة بتركيز أو دو بارفان الأصلي'
                : 'Dior, Chanel, Versace, Prada & Gucci — 100% Authentic Eau de Parfum'}
            </p>
          </div>
          <Link
            href="/categories/perfumes-beauty"
            className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary hover:text-black transition-all"
          >
            <span>{isAr ? 'تصفح كافة العطور' : 'Explore All Fragrances'}</span>
            {isAr ? (
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            ) : (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            )}
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
          {products.slice(0, 5).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              minPrice={product.minPrice}
              variantCount={product.variants_count}
              totalStock={product.total_stock}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
