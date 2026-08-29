'use client';

import React, { useMemo, useState } from 'react';
import {
  Image as ImageIcon,
  User,
  ShoppingBag,
  Sparkles,
  Tag,
  Building2,
  FolderTree,
  Video,
} from 'lucide-react';

export type ImageFallbackKind =
  | 'default'
  | 'avatar'
  | 'product'
  | 'banner'
  | 'badge'
  | 'brand'
  | 'category'
  | 'video';

const kindMap: Record<ImageFallbackKind, React.ComponentType<{ className?: string }>> = {
  default: ImageIcon,
  avatar: User,
  product: ShoppingBag,
  banner: Sparkles,
  badge: Tag,
  brand: Building2,
  category: FolderTree,
  video: Video,
};

export interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt?: string;
  kind?: ImageFallbackKind;
  className?: string;
  fallbackClassName?: string;
  label?: string;
  sublabel?: string;
  fill?: boolean;
  quality?: number;
  priority?: boolean;
}

export function ImageWithFallback({
  src,
  alt,
  kind = 'default',
  className = '',
  fallbackClassName = '',
  label,
  sublabel: _sublabel,
  fill: _fill,
  quality: _quality,
  priority: _priority,
  ...imgProps
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const Icon = useMemo(() => kindMap[kind] ?? ImageIcon, [kind]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || label || 'صورة'}
        className={[
          'flex h-full w-full flex-col items-center justify-center gap-2 rounded-inherit border border-border/70 bg-gradient-to-br from-[#FAF7EF] via-white to-[#F3EDE3] p-4 text-center text-primary',
          fallbackClassName,
          className,
        ].join(' ')}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-background-card/70 shadow-sm">
          <Icon className="h-6 w-6 text-primary/60" />
        </div>
        {label && (
          <div className="space-y-0.5 max-w-[85%]">
            <p className="truncate text-xs font-bold text-[#6F6658]">{label}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      onError={() => setFailed(true)}
      loading={imgProps.loading ?? 'lazy'}
      {...imgProps}
    />
  );
}
