import * as React from 'react';
import { cn } from '../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  brand?: string;
  price?: number | string;
  imageUrl?: string;
  isNew?: boolean;
  onWishlistClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ name, brand, price, imageUrl, isNew, onWishlistClick, className, children, ...props }, ref) => {
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    };
    return (
      <div
        ref={ref}
        className={cn('rounded-lg overflow-hidden transition-transform', className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {imageUrl && <img src={imageUrl} alt={name ?? ''} className="w-full h-48 object-cover" />}
        {children}
        {(name || brand || price) && (
          <div className="p-4">
            {isNew && <span className="text-xs bg-[#C9A84C] text-white px-2 py-1 rounded mb-2 inline-block">جديد</span>}
            {brand && <p className="text-sm text-gray-400">{brand}</p>}
            {name && <p className="font-semibold">{name}</p>}
            {price !== undefined && <p className="text-[#C9A84C]">{price}</p>}
            {onWishlistClick && (
              <button onClick={onWishlistClick} className="mt-2 text-sm text-gray-400 hover:text-[#C9A84C]">
                ♡
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);
Card.displayName = 'Card';
