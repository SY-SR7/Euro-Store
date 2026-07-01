'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, RefreshCw, Search, Star, User, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CartBadge } from '@/components/cart/CartBadge';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

const DESKTOP_LINKS = [
  { href:'/', key:'home' },
  { href:'/products', key:'products' },
  { href:'/categories', key:'categories' },
] as const;

const MOBILE_LINKS = [
  ...DESKTOP_LINKS,
  { href:'/loyalty', key:'loyalty' },
  { href:'/exchange', key:'exchange' },
  { href:'/orders', key:'orders' },
  { href:'/wishlist', key:'wishlist' },
  { href:'/account', key:'account' },
] as const;

export function Header() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/85 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">

        <Link href="/" className="text-base font-black tracking-[0.18em] text-text-primary">
          EURO STORE
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {DESKTOP_LINKS.map(link => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-primary/20 hover:text-primary ${
                  isActive ? 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-sm' : 'text-text-secondary'
                }`}>
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href="/products" aria-label={t('search')}
            className={`hidden rounded-full p-2.5 transition-all duration-200 hover:bg-primary/20 hover:text-primary md:inline-flex ${
              pathname.startsWith('/products') ? 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-sm' : 'text-text-secondary'
            }`}>
            <Search className="h-4 w-4" />
          </Link>
          <Link href="/loyalty" aria-label={t('loyalty')}
            className={`hidden rounded-full p-2.5 transition-all duration-200 hover:bg-primary/20 hover:text-primary sm:inline-flex ${
              pathname.startsWith('/loyalty') ? 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-sm' : 'text-text-secondary'
            }`}>
            <Star className="h-4 w-4" />
          </Link>
          <Link href="/exchange" aria-label={t('exchange')}
            className={`hidden rounded-full p-2.5 transition-all duration-200 hover:bg-primary/20 hover:text-primary sm:inline-flex ${
              pathname.startsWith('/exchange') ? 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-sm' : 'text-text-secondary'
            }`}>
            <RefreshCw className="h-4 w-4" />
          </Link>
          <Link href="/wishlist" aria-label={t('wishlist')}
            className={`hidden rounded-full p-2.5 transition-all duration-200 hover:bg-primary/20 hover:text-primary sm:inline-flex ${
              pathname.startsWith('/wishlist') ? 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-sm' : 'text-text-secondary'
            }`}>
            <Heart className="h-4 w-4" />
          </Link>
          <Link href="/account" aria-label={t('account')}
            className={`hidden md:inline-flex rounded-full p-2.5 transition-all duration-200 hover:bg-primary/20 hover:text-primary ${
              pathname.startsWith('/account') ? 'bg-primary/15 text-primary ring-1 ring-primary/30 shadow-sm' : 'text-text-secondary'
            }`}>
            <User className="h-4 w-4" />
          </Link>
          <div className="hidden md:block">
            <CartBadge />
          </div>
          <LanguageSwitcher />
          <button onClick={() => setOpen(v => !v)}
            className="rounded-full p-2 text-text-secondary transition hover:bg-background-secondary md:hidden">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background-card px-4 py-3 md:hidden">
          <nav className="grid grid-cols-2 gap-1">
            {MOBILE_LINKS.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-background-secondary hover:text-primary ${
                    isActive ? 'bg-background-secondary text-primary' : 'text-text-secondary'
                  }`}>
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}