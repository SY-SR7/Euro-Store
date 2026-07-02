'use client';
/* eslint-disable */
import { Heart } from 'lucide-react';
import { useWishlist } from './WishlistProvider';
import { useTranslations } from 'next-intl';

export function WishlistButton({ productId, size = 'md' }: { productId: string; size?: 'sm' | 'md' }) {
  const t = useTranslations('catalog');
  const { ids, toggle } = useWishlist();
  const active = ids.has(productId);
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconDims = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button
      type="button"
      aria-label={active ? t('removeFromWishlist') : t('addToWishlist')}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(productId);
      }}
      className={`relative z-50 flex ${dims} items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:scale-110 hover:bg-white`}
    >
      <Heart
        className={`${iconDims} transition-colors ${
          active ? 'fill-[#C9A84C] text-primary' : 'text-text-secondary'
        }`}
      />
    </button>
  );
}
