'use client';
import { useTranslations } from 'next-intl';
import { useCartStore, type CartItem } from '@/lib/cart/cartStore';

type Props = Omit<CartItem, 'quantity'> & { outOfStock?: boolean };

export function AddToCartButton({ outOfStock = false, ...item }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const t       = useTranslations('cart');

  return (
    <button
      onClick={() => !outOfStock && addItem(item)}
      disabled={outOfStock}
      className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {outOfStock ? t('outOfStock') : t('addToCart')}
    </button>
  );
}
