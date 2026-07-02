import { getSessionClient } from '@/supabase-server';
import { ProductCard } from '@/app/catalog-components';
import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';

export async function FeaturedCategoryProducts({ 
  categorySlugs, 
  title, 
  bgColor,
  limit = 4 
}: { 
  categorySlugs?: string[]; 
  title: string;
  bgColor?: string;
  limit?: number;
}) {
  const { client: supabase } = await getSessionClient();
  const t = await getTranslations('home');
  const locale = await getLocale();
  const isAr = locale === 'ar';

  let productsQuery = supabase
    .from('products')
    .select(`
      id, name_ar, name_en, slug, description_ar, category_id, brand_id, is_featured, is_active,
      product_images(url, is_primary),
      categories!inner(slug),
      product_variants!inner(
        id, price_syp, compare_price_syp, stock_quantity, is_active,
        variant_attributes(attribute_values(attribute_types(name_ar, name_en)))
      )
    `)
    .eq('is_active', true)
    .eq('product_variants.is_active', true)
    .eq('is_featured', true)
    .limit(limit * 3); // Fetch more to shuffle/pick

  if (categorySlugs && categorySlugs.length > 0) {
    productsQuery = productsQuery.in('categories.slug', categorySlugs);
  }

  const { data: rawProducts } = await productsQuery;
  const productList: any[] = rawProducts ? [...rawProducts] : [];

  if (productList.length === 0) {
    // Fallback: just fetch ANY featured products if no products match the specific category
    const { data: fallbackProducts } = await supabase
      .from('products')
      .select(`
        id, name_ar, name_en, slug, description_ar, category_id, brand_id, is_featured, is_active,
        product_images(url, is_primary),
        categories(slug),
        product_variants!inner(
          id, price_syp, compare_price_syp, stock_quantity, is_active,
          variant_attributes(attribute_values(attribute_types(name_ar, name_en)))
        )
      `)
      .eq('is_active', true)
      .eq('product_variants.is_active', true)
      .eq('is_featured', true)
      .limit(limit);

    if (fallbackProducts && fallbackProducts.length > 0) {
      productList.push(...fallbackProducts);
    }
  }

  if (productList.length === 0) return null;

  // Shuffle and pick 4
  const shuffled = productList.sort(() => 0.5 - Math.random()).slice(0, limit);

  const formattedProducts = shuffled.map((p: any) => {
    const variants = Array.isArray(p.product_variants) ? p.product_variants : [];
    const prices = variants.map((v: any) => Number(v.price_syp)).filter((n: number) => !isNaN(n));
    const images = Array.isArray(p.product_images) ? p.product_images : [];
    const primaryImage = images.find((i: any) => i.is_primary) || images[0];

    return {
      id: p.id,
      name_ar: p.name_ar,
      name_en: p.name_en,
      slug: p.slug,
      image_url: primaryImage?.url ?? '',
      is_featured: p.is_featured,
      minPrice: Math.min(...prices),
      variants_count: variants.length,
      total_stock: variants.reduce((acc: number, v: any) => acc + (v.stock_quantity ?? 0), 0),
    };
  });

  return (
    <section style={bgColor ? { backgroundColor: bgColor } : undefined} className={`py-16 md:py-24 px-4 relative z-10 border-t border-border/30 ${!bgColor && 'bg-background'}`}>
      <div className="container mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-5xl font-black font-headline text-text-primary mb-2">{title}</h2>
            <div className="h-1 w-20 bg-primary rounded-full"></div>
          </div>
          <Link href="/products" className="text-sm font-bold text-primary hover:text-[#9A7209] transition-colors hidden md:block">
            {isAr ? 'عرض المزيد' : 'View More'}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {formattedProducts.map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard product={product} minPrice={product.minPrice} />
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Link href="/products" className="inline-block px-6 py-3 rounded-full bg-background-elevated text-text-primary text-sm font-bold border border-border hover:border-primary/50 transition-colors">
            {isAr ? 'عرض المزيد من المنتجات' : 'View More Products'}
          </Link>
        </div>
      </div>
    </section>
  );
}
