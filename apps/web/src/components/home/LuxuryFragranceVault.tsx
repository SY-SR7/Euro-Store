'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Award } from 'lucide-react';
import { ProductCard } from '@/app/catalog-components';

interface LuxuryFragranceVaultProps {
  products: any[];
  isAr?: boolean;
}

export function LuxuryFragranceVault({ products, isAr = true }: LuxuryFragranceVaultProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#FAF6EE]/60 border-t border-b border-[#E8DFC8]/80 px-4 py-14 md:px-8 md:py-20">
      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[#E8DFC8]/60 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-2">
              <Award className="h-4 w-4 text-primary" />
              <span>{isAr ? 'عطور النخبة الأوروبية' : 'Haute Parfumerie'}</span>
            </div>
            <h2 className="text-2xl font-black text-[#1F1B16] md:text-4xl">
              {isAr ? 'جناح العطور العالمية الفاخرة والأصلية' : 'Authentic Luxury Fragrances'}
            </h2>
            <p className="mt-1 text-xs md:text-sm text-[#6F6658]">
              {isAr
                ? 'ديور، شانيل، فرزاتشي، برادا، وغوتشي — عبق الفخامة بتركيز أو دو بارفان الأصلي 100%'
                : 'Dior, Chanel, Versace, Prada & Gucci — 100% Authentic Eau de Parfum'}
            </p>
          </div>
          <Link
            href="/categories/perfumes-beauty"
            className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-sm hover:bg-primary hover:text-black transition-all"
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
