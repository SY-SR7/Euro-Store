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
      aria-label={t('cart', { fallback: 'السلة' })}
      title={t('cart', { fallback: 'السلة' })}
      data-euro-cart-icon="true"
      className={[
        'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8DCC3] bg-white text-[#6F6658] shadow-sm transition-all hover:border-[#C9A84C] hover:text-[#C9A84C] hover:shadow-md',
        floating ? 'h-12 w-12 border-[#C9A84C]/40 bg-white/95 shadow-lg backdrop-blur' : '',
      ].join(' ')}
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#C9A84C] px-1 text-[10px] font-black leading-none text-[#111] shadow">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}