'use client';

import Link from 'next/link';
import { Menu, RefreshCw, Search, Star, User, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CartBadge } from '@/components/cart/CartBadge';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

const DESKTOP_LINKS = [
  { href: '/', key: 'home' },
  { href: '/products', key: 'products' },
  { href: '/categories', key: 'categories' },
  { href: '/loyalty', key: 'loyalty' },
  { href: '/exchange', key: 'exchange' }
] as const;

const MOBILE_LINKS = [
  ...DESKTOP_LINKS,
  { href: '/orders', key: 'orders' },
  { href: '/account', key: 'account' }
] as const;

export function Header() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F8F5EF]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-black tracking-[0.18em] text-[#171411]">
          EURO STORE
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {DESKTOP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-[#3C352C] transition hover:text-[#C9A84C]"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/products"
            aria-label={t('search')}
            className="hidden rounded-full p-2 text-[#3C352C] transition hover:bg-black/5 md:inline-flex"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/loyalty"
            aria-label={t('loyalty')}
            className="hidden rounded-full p-2 text-[#3C352C] transition hover:bg-black/5 sm:inline-flex"
          >
            <Star className="h-5 w-5" />
          </Link>
          <Link
            href="/exchange"
            aria-label={t('exchange')}
            className="hidden rounded-full p-2 text-[#3C352C] transition hover:bg-black/5 sm:inline-flex"
          >
            <RefreshCw className="h-5 w-5" />
          </Link>
          <Link
            href="/account"
            aria-label={t('account')}
            className="rounded-full p-2 text-[#3C352C] transition hover:bg-black/5"
          >
            <User className="h-5 w-5" />
          </Link>
          <CartBadge />
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full p-2 text-[#3C352C] transition hover:bg-black/5 md:hidden"
            aria-label="menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-black/5 bg-[#F8F5EF] p-4 md:hidden">
          <nav className="grid gap-2">
            {MOBILE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-bold text-[#3C352C] transition hover:bg-black/5"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Header;