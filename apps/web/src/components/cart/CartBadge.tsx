import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingBag } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function CartBadge() {
  const t = useTranslations('cart');
  const pathname = usePathname();
  const isActive = pathname.startsWith('/cart');

  return (
    <Link href="/cart" aria-label={t('title')} 
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-primary/20 hover:text-primary ${
        isActive 
          ? 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-sm border-transparent' 
          : 'border border-border bg-background-card/80 text-text-secondary'
      }`}>
      <ShoppingBag className="h-4 w-4" />
    </Link>
  );
}

export default CartBadge;