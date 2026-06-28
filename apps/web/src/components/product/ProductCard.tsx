"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { Database } from '@eurostore/database';

type Product = Database['public']['Tables']['products']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];

interface ProductCardProps {
  product: Product & { brand?: Brand | null };
  variantPrice?: number;
  isNew?: boolean;
  isOnSale?: boolean;
}

const tiltVariants = {
  rest: { rotateX: 0, rotateY: 0, scale: 1 },
  hover: { scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 20 } },
};

export function ProductCard({ product, variantPrice, isNew, isOnSale }: ProductCardProps) {
  const displayPrice = variantPrice || product.base_price;

  return (
    <motion.div
      variants={tiltVariants}
      initial="rest"
      whileHover="hover"
      style={{ transformStyle: "preserve-3d" }}
      className="group relative bg-[#1E2020] rounded-md overflow-hidden border border-[#2E2E2E] hover:border-[#C9A84C]/30 transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#1A1C1C]">
        {product.primary_image_url ? (
          <Image 
            src={product.primary_image_url}
            alt={product.name_ar}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF]">
            لا توجد صورة
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-2">
          {isNew && (
            <span className="bg-[#C9A84C] text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide shimmer">
              جديد
            </span>
          )}
          {isOnSale && (
            <span className="bg-[#FF4444] text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide">
              خصم
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm z-10">
          <Heart className="w-5 h-5 text-white" />
        </button>
      </div>
      
      <div className="p-4 text-center flex flex-col flex-grow justify-between">
        <div>
          <p className="text-[#9CA3AF] text-[10px] uppercase tracking-widest mb-1">
            {product.brand?.name_en || product.brand?.name_ar || 'EuroStore'}
          </p>
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-[#E2E2E2] text-sm font-medium line-clamp-1 hover:text-[#C9A84C] transition-colors">
              {product.name_ar}
            </h3>
          </Link>
        </div>
        <p className="text-[#C9A84C] font-semibold mt-2 text-sm">
          {new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(displayPrice)}
        </p>
      </div>
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-0" aria-label={`عرض ${product.name_ar}`} />
    </motion.div>
  );
}
