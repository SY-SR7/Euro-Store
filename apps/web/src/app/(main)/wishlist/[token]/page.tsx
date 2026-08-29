import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const tokenSchema = z.string().uuid();

export default async function SharedWishlistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: tokenParam } = await params;
  const t = await getTranslations('catalog');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  
  const token = tokenSchema.safeParse(tokenParam);
  if (!token.success) return notFound();

  const admin = createSupabaseAdminClientFromEnv();
  
  // 1. Find the customer
  const { data: customer } = await admin
    .from('customer_profiles')
    .select('id, full_name')
    .eq('wishlist_share_token', token.data)
    .maybeSingle();

  if (!customer) return notFound();

  // 2. Fetch their wishlist items
  const { data: wishlistData } = await admin
    .from('wishlist_items')
    .select('id, product_id, created_at, products!inner(id, name_ar, name_en, slug, is_active, status, product_images(url, is_primary), product_variants(id, price_syp, compare_price_syp, stock_quantity, is_active))')
    .eq('customer_id', customer.id)
    .eq('products.is_active', true)
    .eq('products.status', 'published')
    .order('created_at', { ascending: false });

  const items = (wishlistData ?? []).map((row) => {
    const product = row.products;
    const variants = (product?.product_variants ?? []).filter((variant) => variant.is_active);
    const totalStock = variants.reduce((s, v) => s + Number(v.stock_quantity || 0), 0);
    const minPrice = variants.length
      ? Math.min(...variants.map((v) => Number(v.price_syp || 0)))
      : null;
    const images = product?.product_images ?? [];
    const primaryImage = images.find((i) => i.is_primary)?.url ?? images[0]?.url ?? null;

    return {
      wishlist_id: row.id,
      product_id: row.product_id,
      slug: product?.slug ?? null,
      name_ar: product?.name_ar ?? '',
      name_en: product?.name_en ?? '',
      is_active: product?.is_active ?? false,
      image_url: primaryImage,
      min_price_syp: minPrice,
      in_stock: totalStock > 0,
    };
  });

  function fmt(n: number | null) {
    if (n == null) return '—';
    return Number(n).toLocaleString(isAr ? 'ar-SY' : 'en-US') + (isAr ? ' ل.س' : ' SYP');
  }

  const title = isAr ? `قائمة أمنيات ${customer.full_name.split(' ')[0]}` : `${customer.full_name.split(' ')[0]}'s Wishlist`;

  return (
    <main className={`min-h-screen bg-background px-4 py-10`} dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 fill-[#C9A84C] text-primary" />
          <h1 className="text-2xl font-black text-text-primary">{title}</h1>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E0D8] bg-background-card p-10 text-center shadow-sm">
            <p className="text-text-muted">{isAr ? 'هذه القائمة فارغة حالياً' : 'This wishlist is currently empty'}</p>
            <Link href="/products"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-text-primary hover:bg-[#9A7209] transition-colors">
              {t('browseProducts')}
            </Link>
          </div>
        ) : (
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
                  />
                  {!item.in_stock && (
                    <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                      {t('outOfStock', { fallback: 'Out of Stock' })}
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <Link href={item.slug ? `/products/${item.slug}` : '#'} className="mb-2 line-clamp-2 text-sm font-bold text-text-primary hover:text-primary transition-colors leading-relaxed">
                    {isAr ? item.name_ar : (item.name_en || item.name_ar)}
                  </Link>

                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold text-text-muted">{t('priceStartFrom', { fallback: 'يبدأ من' })}</p>
                      <p className="text-base font-black text-primary">{fmt(item.min_price_syp)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
