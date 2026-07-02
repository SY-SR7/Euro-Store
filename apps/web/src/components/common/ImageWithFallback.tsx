'use client';

import { useMemo, useState } from 'react';
import {
  ImageIcon,
  Package,
  ShoppingBag,
  Shapes,
  Tag,
  UserRound,
  RotateCcw,
  Star,
  Gift,
  Truck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

type Kind =
  | 'product'
  | 'category'
  | 'brand'
  | 'banner'
  | 'avatar'
  | 'cart'
  | 'order'
  | 'exchange'
  | 'loyalty'
  | 'empty'
  | 'default';

const kindMap: Record<Kind, any> = {
  product: Package,
  category: Shapes,
  brand: Tag,
  banner: Star,
  avatar: UserRound,
  cart: ShoppingBag,
  order: Truck,
  exchange: RotateCcw,
  loyalty: Gift,
  empty: ImageIcon,
  default: ImageIcon,
};

// Removed textMap as we will use translations

export function ImageWithFallback({
  src,
  alt,
  kind = 'default',
  className = '',
  fallbackClassName = '',
  label,
  sublabel,
  ...props
}: {
  src?: string | null;
  alt?: string;
  kind?: Kind;
  className?: string;
  fallbackClassName?: string;
  label?: string;
  sublabel?: string;
  [key: string]: any;
}) {
  const [failed, setFailed] = useState(false);
  const Icon = useMemo(() => kindMap[kind] ?? ImageIcon, [kind]);
  const t = useTranslations('common.imageFallback');

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || label || t(kind, { fallback: 'صورة' })}
        className={[
          'flex h-full w-full flex-col items-center justify-center gap-2 rounded-inherit border border-border/70 bg-gradient-to-br from-[#FAF7EF] via-white to-[#F3EDE3] p-4 text-center text-primary',
          fallbackClassName,
          className,
        ].join(' ')}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-background-card/70 shadow-sm">
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-black text-[#6F6658]">{label || t(kind, { fallback: 'صورة' })}</p>
          {sublabel && <p className="line-clamp-2 text-[11px] text-text-muted">{sublabel}</p>}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      onError={() => setFailed(true)}
      loading={props.loading ?? 'lazy'}
      {...Object.fromEntries(Object.entries(props).filter(([k]) => k !== 'fill' && k !== 'quality' && k !== 'priority'))}
    />
  );
}