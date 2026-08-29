'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ProductCard } from '@/components/product/ProductCard';

type RelatedProduct = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  base_price: number;
  primary_image_url: string | null;
  min_price: number;
  is_new: boolean;
  is_on_sale: boolean;
};

export function SimilarProducts({ productSlug }: { productSlug: string }) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const text = useTranslations('productDetails');
  const isAr = useLocale() === 'ar';

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(productSlug)}/related`, { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { data?: RelatedProduct[] };
        setProducts(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [productSlug]);

  if (loading) return <div className="py-10"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!products.length) return null;

  return (
    <section className="border-t border-border py-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <h2 className="text-2xl font-black text-text-primary">{text('similarProducts', { fallback: 'منتجات مشابهة' })}</h2>
        <p className="mt-2 text-sm text-text-secondary">{text('discoverSimilar', { fallback: 'اكتشف منتجات من نفس القسم' })}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variantPrice={product.min_price} isNew={product.is_new} isOnSale={product.is_on_sale} />
        ))}
      </div>
    </section>
  );
}
