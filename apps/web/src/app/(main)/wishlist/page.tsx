'use client';
/* eslint-disable */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, XCircle, CheckCircle2 } from 'lucide-react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';

interface WishlistItem {
  wishlist_id: string;
  product_id: string;
  slug: string | null;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  image_url: string | null;
  min_price_syp: number | null;
  in_stock: boolean;
}

function fmt(n: number | null) {
  if (n == null) return '—';
  return Number(n).toLocaleString('ar-SY') + ' ل.س';
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const locale = useLocale();
  const t = useTranslations('catalog');
  const isAr = locale === 'ar';

  useEffect(() => {
    fetch('/api/wishlist')
      .then((r) => r.json())
      .then((data) => {
        setAuthenticated(!!data.authenticated);
        setItems(data.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function remove(productId: string) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    }).catch(() => {});
  }

  return (
    <main className={`min-h-screen bg-[#FAFAF8] px-4 py-10`} dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 fill-[#C9A84C] text-[#C9A84C]" />
          <h1 className="text-2xl font-black text-[#1C1917]">{t('wishlist', { fallback: 'المفضلة' })}</h1>
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-[#F3EDE3]" />
            ))}
          </div>
        )}

        {!loading && !authenticated && (
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-10 text-center shadow-sm">
            <p className="text-[#57534E]">{t('loginToViewWishlist', { fallback: 'سجّل الدخول لعرض قائمة المفضلة الخاصة بك' })}</p>
            <Link href="/auth/login?next=/wishlist"
              className="mt-4 inline-block rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#9A7209] transition-colors">
              {t('login', { fallback: 'تسجيل الدخول' })}
            </Link>
          </div>
        )}

        {!loading && authenticated && items.length === 0 && (
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-10 text-center shadow-sm">
            <p className="text-[#A8A29E]">{t('emptyWishlist', { fallback: 'لا توجد منتجات في المفضلة بعد' })}</p>
            <Link href="/products"
              className="mt-4 inline-block rounded-xl bg-[#B8860B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#9A7209] transition-colors">
              {t('browseProducts', { fallback: 'تصفح المنتجات' })}
            </Link>
          </div>
        )}

        {!loading && authenticated && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.wishlist_id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8DCC3] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <Link href={item.slug ? `/products/${item.slug}` : '#'} className="relative aspect-[4/3] overflow-hidden bg-[#F3EDE3]">
                  <ImageWithFallback
                    src={item.image_url}
                    alt={isAr ? item.name_ar : (item.name_en || item.name_ar)}
                    kind="product"
                    label={t('productImage', { fallback: 'صورة المنتج' })}
                    sublabel={isAr ? item.name_ar : (item.name_en || item.name_ar)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className={`absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                    item.in_stock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {item.in_stock ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {item.in_stock ? t('inStock', { fallback: 'متوفر' }) : t('outOfStock', { fallback: 'نفذ من المخزون' })}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Link href={item.slug ? `/products/${item.slug}` : '#'}>
                    <p className="line-clamp-2 font-black leading-tight text-[#1F1B16]">{isAr ? item.name_ar : (item.name_en || item.name_ar)}</p>
                  </Link>
                  <p className="mt-auto font-bold text-[#B8860B]">{fmt(item.min_price_syp)}</p>
                  <button
                    type="button"
                    onClick={() => remove(item.product_id)}
                    className="rounded-xl border border-[#E5E0D8] py-2 text-xs font-bold text-[#57534E] transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    {t('removeFromWishlist', { fallback: 'إزالة من المفضلة' })}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
