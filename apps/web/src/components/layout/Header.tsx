'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, RefreshCw, Search, Star, User, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { CartBadge } from '@/components/cart/CartBadge';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

import { CartDrawer } from '@/components/cart/CartDrawer';
import { ShoppingBag } from 'lucide-react';
import { SmartSearch } from '@/components/layout/SmartSearch';

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

export function Header({ loyaltyPoints = null }: { loyaltyPoints?: number | null }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0.9]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.05], ["blur(10px)", "blur(20px)"]);

  return (
    <>
      <motion.header 
        style={{ opacity: headerOpacity, backdropFilter: headerBlur }}
        className="sticky top-0 z-50 border-b border-white/30 bg-white/85 shadow-sm transition-colors duration-300"
      >
        <motion.div 
          className="absolute top-0 left-0 right-0 h-[2px] bg-primary origin-left z-50"
          style={{ scaleX }}
        />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">

          <Link href="/" className="flex items-center">
            <img src="/images/logo.png" alt="Euro Store" className="h-10 w-auto object-contain" />
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
            {(pathname === '/' || pathname.startsWith('/products') || pathname.startsWith('/categories')) && (
              <SmartSearch />
            )}
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
            
            {/* Cart Button */}
            <button onClick={() => setIsCartOpen(true)} aria-label="Open Cart" className="relative hidden md:flex items-center justify-center rounded-full p-2.5 transition-all duration-200 hover:bg-primary/20 hover:text-primary text-text-secondary">
              <ShoppingBag className="h-4 w-4" />
            </button>

            {loyaltyPoints !== null && (
              <Link href="/loyalty" className="hidden md:flex items-center gap-1.5 bg-[#FEF3C7] text-primary px-3 py-1.5 rounded-full border border-primary/20 shadow-sm transition-transform hover:scale-105" title={t('loyalty')}>
                <Star className="h-3.5 w-3.5 fill-primary" />
                <span className="text-xs font-black">{loyaltyPoints}</span>
              </Link>
            )}

            {/* Language Switcher moved to account page */}
          </div>
        </div>
      </motion.header>

      {/* Slide-over Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}