'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ProductCard } from '@/components/product/ProductCard';
import { useTranslations } from 'next-intl';

export function SimilarProducts({ categoryId, currentProductId }: { categoryId: string; currentProductId: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  useEffect(() => {
    if (!categoryId) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function fetchSimilar() {
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(*)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .order('created_at', { ascending: false })
        .limit(4);

      setProducts(data ?? []);
      setLoading(false);
    }

    fetchSimilar();
  }, [categoryId, currentProductId]);

  if (loading) {
    return (
      <div className="py-10">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-10 border-t border-border">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-primary">منتجات مشابهة</h2>
          <p className="mt-2 text-sm text-text-secondary">اكتشف منتجات من نفس القسم</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
