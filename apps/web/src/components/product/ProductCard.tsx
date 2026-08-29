'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { useLocale, useTranslations } from 'next-intl';

export interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name_ar: string;
    name_en?: string | null;
    base_price?: number;
    compare_price_syp?: number | null;
    is_featured?: boolean;
    created_at?: string;
    product_images?: Array<{ url: string; is_primary?: boolean }>;
    primary_image_url?: string | null;
    image_url?: string | null;
    product_variants?: Array<{ price_syp: number; compare_price_syp?: number | null }>;
    brand?: { name: string } | null;
  };
  variantPrice?: number;
  isNew?: boolean;
  isOnSale?: boolean;
}

const tiltVariants: Variants = {
  rest: { rotateX: 0, rotateY: 0, scale: 1 },
  hover: { 
    y: -4,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

export function ProductCard({ product, variantPrice, isNew: propIsNew, isOnSale: propIsOnSale }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const isAr = locale === 'ar';
  
  const productName = isAr ? product.name_ar : (product.name_en || product.name_ar);
  const primaryImage = product.product_images?.find(img => img.is_primary)?.url 
    || product.product_images?.[0]?.url 
    || product.primary_image_url 
    || product.image_url;
  const productImage = primaryImage || null;
  
  // Calculate lowest price & discount
  const minPrice = variantPrice ?? (product.product_variants?.length 
    ? Math.min(...product.product_variants.map(v => v.price_syp))
    : (product.base_price ?? 0));

  const comparePrice = product.product_variants?.length
    ? product.product_variants[0]?.compare_price_syp
    : product.compare_price_syp;

  const isOnSale = propIsOnSale ?? Boolean(comparePrice && comparePrice > minPrice);
  const isNew = propIsNew ?? (product.created_at ? (new Date().getTime() - new Date(product.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000 : false);

  return (
    <motion.div
      variants={tiltVariants}
      initial="rest"
      whileHover="hover"
      className="group relative bg-background-elevated rounded-2xl overflow-hidden border border-border/60 hover:border-primary/40 transition-colors duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-white p-4">
        {productImage ? (
          <Image 
            src={productImage}
            alt={productName}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted">
            {t('noImage')}
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-2 z-10">
          {isNew && (
            <span className="bg-primary/90 backdrop-blur-sm text-[#1F1B16] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {t('new')}
            </span>
          )}
          {isOnSale && (
            <span className="bg-error/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {t('sale')}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <WishlistButton productId={product.id} size="sm" />
        </div>
      </div>
      
      <div className="p-5 text-center flex flex-col flex-grow justify-between bg-gradient-to-b from-transparent to-background-card/50">
        <div>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5">
            {product.brand?.name || 'EuroStore'}
          </p>
          <Link href={`/products/${product.slug}`} className="block relative z-20">
            <h3 className="text-text-primary text-sm font-semibold line-clamp-1 hover:text-primary transition-colors">
              {productName}
            </h3>
          </Link>
        </div>

        <div className="mt-4 flex items-baseline justify-center gap-2">
          <PriceDisplay amountSyp={minPrice} className="text-base font-bold text-primary" />
          {isOnSale && comparePrice && (
            <span className="text-xs text-text-muted line-through">
              {comparePrice.toLocaleString(isAr ? 'ar-SY' : 'en-US')} {isAr ? 'ل.س' : 'SYP'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
