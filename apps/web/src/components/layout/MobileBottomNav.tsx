'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingBag, Heart, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function MobileBottomNav() {
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tCart = useTranslations('cart');

  const navItems = [
    { href: '/', icon: Home, label: tNav('home'), key: 'home' },
    { href: '/categories', icon: LayoutGrid, label: tNav('categories'), key: 'categories' },
    { href: '/cart', icon: ShoppingBag, label: tCart('title'), key: 'cart' },
    { href: '/wishlist', icon: Heart, label: tNav('wishlist'), key: 'wishlist' },
    { href: '/account', icon: User, label: tNav('account'), key: 'account' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background-card/95 pb-safe backdrop-blur-xl shadow-[0_-4px_15px_rgba(0,0,0,0.04)] md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex h-full w-full flex-col items-center justify-center gap-1 transition-all duration-200 ${
              isActive ? 'text-primary' : 'text-text-secondary hover:text-text-secondary'
            }`}
          >
            <div className={`relative flex items-center justify-center rounded-full p-1.5 transition-all duration-200 ${
              isActive ? 'bg-primary/15 ring-1 ring-primary/30' : ''
            }`}>
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
