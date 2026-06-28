import * as React from 'react';
import { Heart } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ProductCardProps {
  name: string;
  brand: string;
  price: number | bigint;
  imageUrl: string;
  isNew?: boolean;
  onWishlistClick?: () => void;
  className?: string;
}

export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ name, brand, price, imageUrl, isNew, onWishlistClick, className, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "group relative bg-[#1E2020] rounded-md overflow-hidden border border-[#2E2E2E] hover:border-[#C9A84C]/30 transition-all duration-300",
          className
        )}
        style={{ transformStyle: 'preserve-3d' }}
        onMouseMove={(e) => {
          const card = e.currentTarget;
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -5;
          const rotateY = ((x - centerX) / centerX) * 5;
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }}
        onMouseLeave={(e) => {
          const card = e.currentTarget;
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        }}
        {...props}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[#2E2E2E]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt={name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
          />
          {/* Badge */}
          {isNew && (
            <span className="absolute top-3 start-3 bg-[#C9A84C] text-black text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wide">
              New
            </span>
          )}
          {/* Wishlist */}
          <button 
            type="button"
            className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-black/20 rounded-full"
            onClick={(e) => {
              e.preventDefault();
              onWishlistClick?.();
            }}
          >
            <Heart className="text-white w-5 h-5" />
          </button>
        </div>
        <div className="p-4 text-center" style={{ transform: 'translateZ(20px)' }}>
          <p className="text-[#9CA3AF] text-xs uppercase tracking-widest mb-1">{brand}</p>
          <h3 className="text-[#E2E2E2] font-medium line-clamp-1">{name}</h3>
          <p className="text-[#C9A84C] font-semibold mt-1">{price.toString()} ل.س</p>
        </div>
      </div>
    );
  }
);

ProductCard.displayName = 'ProductCard';
