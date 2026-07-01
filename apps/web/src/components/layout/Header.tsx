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
            <button onClick={() => setIsCartOpen(true)} className="relative hidden md:flex items-center justify-center rounded-full p-2.5 transition-all duration-200 hover:bg-primary/20 hover:text-primary text-text-secondary">
              <ShoppingBag className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 pointer-events-none scale-75">
                <CartBadge />
              </div>
            </button>

            <LanguageSwitcher />
            
            {/* Mobile buttons */}
            <button onClick={() => setIsCartOpen(true)} className="relative md:hidden rounded-full p-2 text-text-secondary transition hover:bg-background-secondary">
              <ShoppingBag className="h-4 w-4" />
              <div className="absolute top-0 right-0 pointer-events-none scale-50">
                <CartBadge />
              </div>
            </button>

            <button onClick={() => setOpen(v => !v)}
              className="relative z-50 rounded-full p-2 text-text-secondary transition hover:bg-background-secondary md:hidden">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 z-40 bg-background/95 md:hidden flex flex-col pt-24 px-6 overflow-hidden"
            >
              <motion.nav 
                initial="closed"
                animate="open"
                exit="closed"
                variants={{
                  open: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
                  closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
                }}
                className="flex flex-col gap-6"
              >
                {MOBILE_LINKS.map(link => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                  return (
                    <motion.div
                      key={link.href}
                      variants={{
                        closed: { opacity: 0, y: 30, scale: 0.95 },
                        open: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                      }}
                    >
                      <Link href={link.href} onClick={() => setOpen(false)}
                        className={`block text-3xl font-headline font-black transition-colors ${
                          isActive ? 'text-[#C9A84C]' : 'text-text-primary hover:text-primary'
                        }`}>
                        {t(link.key)}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-auto pb-10"
              >
                <div className="h-px w-full bg-border/50 mb-6" />
                <div className="flex items-center gap-6">
                  <LanguageSwitcher />
                  <span className="text-xs font-bold tracking-widest uppercase text-text-secondary">Euro Store © 2025</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Slide-over Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}