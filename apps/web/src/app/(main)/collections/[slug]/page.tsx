import { notFound } from 'next/navigation';
import { getSessionClient } from '@/supabase-server';
import { ProductCard } from '@/components/product/ProductCard';

export const revalidate = 60; // ISR 1 minute

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const { client: supabase } = await getSessionClient();
  const { locale } = await import('next-intl/server').then(m => m.getLocale()).then(loc => ({ locale: loc }));
  const isAr = locale === 'ar';

  const { data: collection } = await supabase
    .from('collections')
    .select(`
      id, name_ar, name_en, description_ar, description_en,
      collection_products (
        products (
          id, name_ar, name_en, slug, base_price, discount_percentage,
          product_images (url)
        )
      )
    `)
    .eq('slug', params.slug)
    .eq('is_active', true)
    .eq('has_standalone_page', true)
    .maybeSingle();

  if (!collection) return notFound();

  // Extract products
  const products = collection.collection_products
    ?.map((collectionProduct) => collectionProduct.products)
    .filter((product): product is NonNullable<typeof product> => Boolean(product)) ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-text-primary mb-4">
          {isAr ? collection.name_ar : collection.name_en}
        </h1>
        <p className="text-text-secondary max-w-2xl mx-auto text-lg">
          {isAr ? collection.description_ar : collection.description_en}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-text-muted">
          {isAr ? 'لا يوجد منتجات في هذه التشكيلة حالياً' : 'No products in this collection yet.'}
        </div>
      )}
    </div>
  );
}
