'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart/cartStore';
import { useTranslations } from 'next-intl';

export function CartIconLink({ floating = false }: { floating?: boolean }) {
  const t = useTranslations('nav');
  const items = useCartStore((s: any) => s.items ?? s.cart ?? s.cartItems ?? []);

  const count = Array.isArray(items)
    ? items.reduce((sum: number, item: any) => sum + Number(item.quantity ?? item.qty ?? 1), 0)
    : 0;

  return (
    <Link
      href="/cart"
      aria-label={t('cart')}
      title={t('cart')}
      data-euro-cart-icon="true"
      className={[
        'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background-card text-[#6F6658] shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md',
        floating ? 'h-12 w-12 border-primary/40 bg-background-card/95 shadow-lg backdrop-blur' : '',
      ].join(' ')}
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black leading-none text-text-primary shadow">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}