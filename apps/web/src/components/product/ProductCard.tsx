// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
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
  rest: { 
    y: 0,
    scale: 1, 
    boxShadow: "0px 4px 10px rgba(0,0,0,0.02)"
  },
  hover: { 
    y: -8,
    scale: 1.02,
    boxShadow: "0px 15px 30px rgba(184, 134, 11, 0.15)", // Primary gold glow
    transition: { type: "spring", stiffness: 400, damping: 25 } 
  },
};

export function ProductCard({ product, variantPrice, isNew, isOnSale }: ProductCardProps) {
  const displayPrice = variantPrice || product.base_price;
  const locale = useLocale();
  const t = useTranslations('catalog');
  const isAr = locale === 'ar';
  const productName = isAr ? product.name_ar : (product.name_en || product.name_ar);

  return (
    <motion.div
      variants={tiltVariants}
      initial="rest"
      whileHover="hover"
      className="group relative bg-background-elevated rounded-2xl overflow-hidden border border-border/60 hover:border-primary/40 transition-colors duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-background-secondary">
        {product.primary_image_url ? (
          <Image 
            src={product.primary_image_url}
            alt={productName}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
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
            {isAr ? (product.brand?.name_ar || product.brand?.name_en || 'EuroStore') : (product.brand?.name_en || product.brand?.name_ar || 'EuroStore')}
          </p>
          <Link href={`/products/${product.slug}`} className="block relative z-20">
            <h3 className="text-text-primary text-sm font-semibold line-clamp-1 hover:text-primary transition-colors">
              {productName}
            </h3>
          </Link>
        </div>
        <p className="text-primary font-black mt-3 text-[15px]">
          {new Intl.NumberFormat(isAr ? 'ar-SY' : 'en-US', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(displayPrice)}
        </p>
      </div>
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={`${t('viewProduct')} ${productName}`} />
      
      {/* Quick Add to Cart Button */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 w-[85%]">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Fallback to product.id as variantId if not variant specific
            const variantId = product.id; 
            useCartStore.getState().addItem({
              variantId,
              productId: product.id,
              productSlug: product.slug,
              nameAr: product.name_ar,
              nameEn: product.name_en || product.name_ar,
              sku: product.slug,
              priceSyp: displayPrice,
              comparePriceSyp: null,
              imageUrl: product.primary_image_url
            });
            import('sonner').then(({ toast }) => {
              toast.success(isAr ? 'تمت الإضافة للسلة' : 'Added to cart', {
                description: productName,
                style: { backgroundColor: '#1F1B16', color: '#B8860B', borderColor: '#B8860B33' }
              });
            });
          }}
          className="w-full bg-primary text-[#0F0F0F] font-bold py-2.5 rounded-xl shadow-lg hover:bg-[#9A7209] transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          {isAr ? 'أضف سريعاً' : 'Quick Add'}
        </button>
      </div>
    </motion.div>
  );
}

