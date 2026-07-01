import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingBag } from 'lucide-react';

export function CartBadge() {
  const t = useTranslations('cart');

  return (
    <Link href="/cart" aria-label={t('title')} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#57534E] hover:bg-[#F5F5F4] hover:text-[#B8860B] transition">
      <ShoppingBag className="h-4 w-4" />
    </Link>
  );
}

export default CartBadge;