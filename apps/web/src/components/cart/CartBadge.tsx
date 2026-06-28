'use client';
import Link from 'next/link';
import { useCartStore } from '../../lib/cart/cartStore';
import { ShoppingBag } from 'lucide-react';

export function CartBadge() {
  const totalItems = useCartStore((s) => s.totalItems());
  return (
    <Link href="/cart" className="relative flex items-center gap-1 text-sm text-[#D6D3C7] hover:text-[#C9A84C] transition-colors">
      <ShoppingBag className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -top-1.5 -end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A84C] text-[10px] font-bold text-[#111]">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </Link>
  );
}