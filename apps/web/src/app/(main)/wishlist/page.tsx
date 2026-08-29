'use client';
/* eslint-disable */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, XCircle, CheckCircle2, Share2 } from 'lucide-react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { AuthModalButton } from '@/components/auth/AuthAwareLink';

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

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const locale = useLocale();

  function fmt(n: number | null) {
    if (n == null) return '—';
    return Number(n).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US') + (locale === 'ar' ? ' ل.س' : ' SYP');
  }
  const t = useTranslations('catalog');
  const isAr = locale === 'ar';

  useEffect(() => {
    fetch('/api/wishlist')
      .then((r) => r.json())
      .then((data) => {
        setAuthenticated(!!data.authenticated);
        setItems(data.items ?? []);
        if (data.share_token) setShareToken(data.share_token);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleShare() {
    setSharing(true);
    setShareError('');
    try {
      let token = shareToken;
      if (!token) {
        const response = await fetch('/api/wishlist/share', { method: 'POST' });
        if (!response.ok) throw new Error('share_failed');
        const data = await response.json();
        token = data.token;
        setShareToken(token);
      }
      await navigator.clipboard.writeText(`${window.location.origin}/wishlist/${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError(isAr ? 'تعذر إنشاء رابط المشاركة.' : 'The share link could not be created.');
    } finally {
      setSharing(false);
    }
  }

  async function remove(productId: string) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    }).catch(() => {});
  }

  return (
    <main className={`min-h-screen bg-background px-4 py-10`} dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 fill-[#C9A84C] text-primary" />
            <h1 className="text-2xl font-black text-text-primary">{t('wishlist')}</h1>
          </div>
          {authenticated && items.length > 0 && (
            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={sharing}
              className="flex items-center gap-2 rounded-xl border border-border bg-background-card px-4 py-2 text-sm font-bold text-text-primary hover:border-primary transition-colors"
            >
              <Share2 className="h-4 w-4" />
              {sharing ? (isAr ? 'جارٍ التجهيز' : 'Preparing') : copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'مشاركة القائمة' : 'Share Wishlist')}
            </button>
          )}
        </div>
        {shareError && <p role="alert" className="text-sm font-semibold text-red-700">{shareError}</p>}

        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-[#F3EDE3]" />
            ))}
          </div>
        )}

        {!loading && !authenticated && (
          <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-10 text-center shadow-sm">
            <p className="text-text-secondary">{t('loginToViewWishlist')}</p>
            <AuthModalButton next="/wishlist"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-text-primary hover:bg-[#9A7209] transition-colors">
              {t('login')}
            </AuthModalButton>
          </div>
        )}

        {!loading && authenticated && items.length === 0 && (
          <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-10 text-center shadow-sm">
            <p className="text-text-muted">{t('emptyWishlist')}</p>
            <Link href="/products"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-text-primary hover:bg-[#9A7209] transition-colors">
              {t('browseProducts')}
            </Link>
          </div>
        )}

        {!loading && authenticated && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.wishlist_id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <Link href={item.slug ? `/products/${item.slug}` : '#'} className="relative aspect-[4/3] overflow-hidden bg-[#F3EDE3]">
                  <ImageWithFallback
                    src={item.image_url}
                    alt={isAr ? item.name_ar : (item.name_en || item.name_ar)}
                    kind="product"
                    label={t('productImage')}
                    sublabel={isAr ? item.name_ar : (item.name_en || item.name_ar)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className={`absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                    item.in_stock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {item.in_stock ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {item.in_stock ? t('inStock') : t('outOfStock')}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Link href={item.slug ? `/products/${item.slug}` : '#'}>
                    <p className="line-clamp-2 font-black leading-tight text-[#1F1B16]">{isAr ? item.name_ar : (item.name_en || item.name_ar)}</p>
                  </Link>
                  <p className="mt-auto font-bold text-primary">{fmt(item.min_price_syp)}</p>
                  <button
                    type="button"
                    onClick={() => remove(item.product_id)}
                    className="rounded-xl border border-[#E5E0D8] py-2 text-xs font-bold text-text-secondary transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    {t('removeFromWishlist')}
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
