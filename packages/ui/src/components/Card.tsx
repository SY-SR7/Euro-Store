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
    return (
      <div
        ref={ref}
        className={cn('overflow-hidden rounded-xl border border-border bg-background-card text-text-primary', className)}
        {...props}
      >
        {imageUrl && <img src={imageUrl} alt={name ?? ''} width={480} height={480} loading="lazy" className="h-48 w-full object-cover" />}
        {children}
        {(name || brand || price) && (
          <div className="p-4">
            {isNew && <span className="mb-2 inline-block rounded bg-primary/15 px-2 py-1 text-xs font-bold text-primary">جديد</span>}
            {brand && <p className="text-sm text-text-secondary">{brand}</p>}
            {name && <p className="font-semibold">{name}</p>}
            {price !== undefined && <p className="font-semibold tabular-nums text-primary">{price}</p>}
            {onWishlistClick && (
              <button type="button" onClick={onWishlistClick} aria-label="إضافة إلى المفضلة" className="mt-2 min-h-11 min-w-11 rounded-lg text-sm text-text-secondary transition-colors hover:bg-background-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
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
