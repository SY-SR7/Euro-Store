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
      className="w-full rounded-sm bg-primary py-3 text-sm font-semibold text-[#111111] hover:bg-[#D8B95F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {outOfStock ? t('outOfStock') : t('addToCart')}
    </button>
  );
}
