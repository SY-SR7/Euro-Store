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
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-[#FACC15]/20 hover:text-[#B8860B] ${
        isActive 
          ? 'bg-[#FACC15]/15 text-[#B8860B] ring-1 ring-[#B8860B]/30 shadow-sm border-transparent' 
          : 'border border-black/10 bg-white/80 text-[#57534E]'
      }`}>
      <ShoppingBag className="h-4 w-4" />
    </Link>
  );
}

export default CartBadge;