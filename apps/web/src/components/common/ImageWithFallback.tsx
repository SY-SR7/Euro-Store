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

const textMap: Record<Kind, string> = {
  product: 'صورة المنتج',
  category: 'صورة التصنيف',
  brand: 'العلامة التجارية',
  banner: 'Euro Store',
  avatar: 'الحساب',
  cart: 'السلة',
  order: 'الطلب',
  exchange: 'الاستبدال',
  loyalty: 'الولاء',
  empty: 'لا توجد صورة',
  default: 'صورة',
};

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

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || label || textMap[kind] || 'صورة'}
        className={[
          'flex h-full w-full flex-col items-center justify-center gap-2 rounded-inherit border border-[#E8DCC3]/70 bg-gradient-to-br from-[#FAF7EF] via-white to-[#F3EDE3] p-4 text-center text-[#C9A84C]',
          fallbackClassName,
          className,
        ].join(' ')}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A84C]/30 bg-white/70 shadow-sm">
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-black text-[#6F6658]">{label || textMap[kind] || 'صورة'}</p>
          {sublabel && <p className="line-clamp-2 text-[11px] text-[#A8A29E]">{sublabel}</p>}
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
      {...props}
    />
  );
}