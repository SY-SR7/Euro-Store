'use client';
/* eslint-disable */
import { Heart } from 'lucide-react';
import { useWishlist } from './WishlistProvider';

export function WishlistButton({ productId, size = 'md' }: { productId: string; size?: 'sm' | 'md' }) {
  const { ids, toggle } = useWishlist();
  const active = ids.has(productId);
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconDims = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button
      type="button"
      aria-label={active ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(productId);
      }}
      className={`flex ${dims} items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:scale-110 hover:bg-white`}
    >
      <Heart
        className={`${iconDims} transition-colors ${
          active ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-[#57534E]'
        }`}
      />
    </button>
  );
}
