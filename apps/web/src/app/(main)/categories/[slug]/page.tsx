// @ts-nocheck
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminSupabaseClient } from '@/supabase-server';
import { ProductCard } from '../../../catalog-components';
import { createCatalogLookup } from '../../../catalog-types';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = createAdminSupabaseClient();

  const categoryRes = await supabase
    .from('categories')
    .select('id,name_ar,name_en,slug,sort_order,is_active')
    .eq('slug', params.slug)
    .maybeSingle();

  const category = categoryRes.data;
  if (!category) notFound();

  const [categoriesRes, brandsRes, variantsRes, productsRes] = await Promise.all([
    supabase.from('categories').select('id,name_ar,name_en,slug,sort_order,is_active').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id,name,slug,is_active').eq('is_active', true).order('name'),
    supabase.from('product_variants').select('id,product_id,sku,price_syp,compare_price_syp,stock_quantity,is_active').eq('is_active', true),
    supabase
      .from('products')
      .select('id,name_ar,name_en,slug,description_ar,description_en,category_id,brand_id,is_featured,is_active,image_url')
      .eq('is_active', true)
      .eq('category_id', category.id)
      .order('created_at', { ascending: false }),
  ]);

  const categories = categoriesRes.data ?? [];
  const brands = brandsRes.data ?? [];
  const variants = variantsRes.data ?? [];
  const products = productsRes.data ?? [];

  const categoryLookup = createCatalogLookup(categories);
  const brandLookup = createCatalogLookup(brands);

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-6 py-12 text-[#1F1B16]" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-10">
        <Link href="/categories" className="text-sm font-bold text-[#C9A84C] hover:underline">
          كل التصنيفات
        </Link>

        <section className="border-b border-[#E8DCC3] pb-10 text-right">
          <p className="text-sm font-bold text-[#C9A84C]">تصنيف</p>
          <h1 className="mt-3 text-6xl font-black">{category.name_ar}</h1>
          {category.name_en ? <p className="mt-3 text-lg text-[#6F6658]">{category.name_en}</p> : null}
        </section>

        <section>
          <h2 className="text-2xl font-black">كل المنتجات</h2>
          <p className="mt-2 text-sm text-[#6F6658]">عدد المنتجات: {products.length}</p>

          {products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-12 text-center text-[#6F6658]">
              لا توجد منتجات في هذا التصنيف حالياً
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variants={variants}
                  category={product.category_id ? categoryLookup.get(product.category_id) : undefined}
                  brand={product.brand_id ? brandLookup.get(product.brand_id) : undefined}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}