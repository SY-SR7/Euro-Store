'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ProductCard } from '@/components/product/ProductCard';

export function RecommendedProducts({ currentProductId }: { currentProductId: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function fetchRecommended() {
      // Fetch some recent active products to shuffle them
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(*)
        `)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .order('created_at', { ascending: false })
        .limit(20);

      let shuffled = data ?? [];
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setProducts(shuffled.slice(0, 4));
      setLoading(false);
    }

    fetchRecommended();
  }, [currentProductId]);

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
          <h2 className="text-2xl font-black text-text-primary">منتجات قد تعجبك</h2>
          <p className="mt-2 text-sm text-text-secondary">تشكيلة مميزة من مختلف الأقسام</p>
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
