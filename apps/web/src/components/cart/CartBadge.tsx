'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function CartBadge() {
  const t = useTranslations('cart');

  return (
    <Link href="/cart" aria-label={t('title')} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80">
      🛒
    </Link>
  );
}

export default CartBadge;