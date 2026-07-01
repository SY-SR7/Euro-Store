'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart/cartStore';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, updateQty, removeItem, totalSyp, totalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const t = useTranslations('cart'); // Assuming a translation namespace exists
  const isAr = locale === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const FREE_SHIPPING_THRESHOLD = 500000;
  const currentTotal = totalSyp();
  const progress = Math.min((currentTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - currentTotal, 0);

  const formatPrice = (p: number) => p.toLocaleString('ar-SY') + ' ل.س';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: isAr ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isAr ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl ${isAr ? 'left-0' : 'right-0'}`}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
              <h2 className="flex items-center gap-2 text-xl font-headline font-black">
                <ShoppingBag size={20} className="text-primary" />
                {t('title') || 'حقيبة التسوق'} 
                <span className="text-sm font-bold text-text-secondary">({totalItems()})</span>
              </h2>
              <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-background-secondary text-text-secondary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            {/* Free Shipping Bar */}
            <div className="bg-background-secondary/50 px-6 py-4">
              <div className="mb-2 text-sm font-bold">
                {progress >= 100 ? (
                  <span className="text-green-600">🎉 مبروك! لقد حصلت على شحن مجاني.</span>
                ) : (
                  <span>
                    أضف <strong className="text-primary">{formatPrice(remaining)}</strong> للحصول على شحن مجاني!
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag size={64} className="mb-4 text-border" />
                  <p className="text-lg font-bold">حقيبة التسوق فارغة</p>
                  <p className="text-sm">لم تقم بإضافة أي منتجات بعد.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {items.map((item) => (
                    <motion.div layout key={item.variantId} className="flex gap-4">
                      {item.imageUrl ? (
                        <Link href={`/products/${item.productSlug}`} onClick={onClose} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-border transition-transform hover:scale-105 hover:shadow-md block">
                          <img src={item.imageUrl} alt={isAr ? item.nameAr : item.nameEn} className="h-full w-full object-cover" />
                        </Link>
                      ) : (
                        <Link href={`/products/${item.productSlug}`} onClick={onClose} className="h-24 w-20 shrink-0 rounded-xl bg-background-secondary transition-transform hover:scale-105 hover:shadow-md block" />
                      )}
                      <div className="flex flex-1 flex-col py-1">
                        <Link href={`/products/${item.productSlug}`} onClick={onClose} className="font-bold hover:text-primary transition-colors line-clamp-1">
                          {isAr ? item.nameAr : item.nameEn}
                        </Link>
                        <span className="text-xs text-text-secondary mt-1">{item.sku}</span>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-border bg-background-secondary p-1">
                            <button onClick={() => updateQty(item.variantId, item.quantity - 1)} className="flex h-6 w-6 items-center justify-center rounded text-lg hover:bg-background-card">-</button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQty(item.variantId, item.quantity + 1)} className="flex h-6 w-6 items-center justify-center rounded text-lg hover:bg-background-card">+</button>
                          </div>
                          <span className="font-black text-primary">{formatPrice(item.priceSyp * item.quantity)}</span>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.variantId)} className="self-start p-2 text-text-muted transition-colors hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border/50 bg-background px-6 py-5 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                <div className="mb-4 flex items-center justify-between font-black">
                  <span>الإجمالي:</span>
                  <span className="text-xl text-primary">{formatPrice(currentTotal)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-text-primary transition-all hover:scale-[1.02] hover:bg-[#C9A84C] hover:shadow-lg hover:shadow-primary/20"
                >
                  إتمام الطلب
                  <ArrowRight size={18} className="transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
