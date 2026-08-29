'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Watch } from 'lucide-react';
import { ProductCard } from '@/app/catalog-components';

interface AccessoriesSpotlightSectionProps {
  products: any[];
  isAr?: boolean;
}

export function AccessoriesSpotlightSection({ products, isAr = true }: AccessoriesSpotlightSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="border-t border-border/80 bg-background-card/30 px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-2">
              <Watch className="h-4 w-4" />
              <span>{isAr ? 'الساعات والإكسسوارات' : 'Watches & Eyewear'}</span>
            </div>
            <h2 className="text-2xl font-black text-text-primary md:text-4xl">
              {isAr ? 'نظارات ريبان وساعات كاسيو والإكسسوارات' : 'Iconic Watches, Sunglasses & Accessories'}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {isAr
                ? 'تشكيلة النظارات الشمسية، ساعات جي شوك، الأحزمة الجلدية والقبعات'
                : 'Ray-Ban Sunglasses, G-Shock Watches, Leather Belts & Caps'}
            </p>
          </div>
          <Link
            href="/categories/watches-accessories"
            className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors"
          >
            <span>{isAr ? 'عرض كافة الإكسسوارات' : 'View All Accessories'}</span>
            {isAr ? (
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            ) : (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            )}
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {products.map((product) => (
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
