// @ts-nocheck
import Link from 'next/link';
import { createAdminSupabaseClient } from '@/supabase-server';
import { ProductCard } from '../catalog-components';
import { createCatalogLookup } from '../catalog-types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createAdminSupabaseClient();

  const [productsRes, categoriesRes, brandsRes, variantsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id,name_ar,name_en,slug,description_ar,description_en,category_id,brand_id,is_featured,is_active,image_url')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('categories').select('id,name_ar,name_en,slug,sort_order,is_active').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id,name,slug,is_active').eq('is_active', true).order('name'),
    supabase.from('product_variants').select('id,product_id,sku,price_syp,compare_price_syp,stock_quantity,is_active').eq('is_active', true),
  ]);

  const products = productsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const brands = brandsRes.data ?? [];
  const variants = variantsRes.data ?? [];

  const categoryLookup = createCatalogLookup(categories);
  const brandLookup = createCatalogLookup(brands);

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-6 py-14 text-[#1F1B16]" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-16">
        <section className="grid min-h-[300px] items-center gap-8 lg:grid-cols-2">
          <div className="text-right">
            <p className="text-sm font-bold text-[#C9A84C]">أزياء أوروبية تصل إلى بابك</p>
            <h1 className="mt-4 text-5xl font-black leading-tight lg:text-7xl">
              أناقة يومية بلمسة أوروبية
            </h1>
          </div>

          <div className="text-right lg:text-left">
            <p className="text-[#6F6658]">Everyday Elegance, European Touch</p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-xl bg-[#C9A84C] px-8 py-4 font-black text-[#1F1B16] transition hover:bg-[#D8B95F]"
            >
              تسوق الآن
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-8 flex items-end justify-between gap-4">
            <Link href="/products" className="text-sm font-bold text-[#C9A84C] hover:underline">
              عرض الكل
            </Link>
            <div className="text-right">
              <p className="text-sm font-bold text-[#C9A84C]">مختاراتنا</p>
              <h2 className="mt-2 text-3xl font-black">اختيارات مميزة</h2>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-12 text-center text-[#6F6658]">
              لا توجد منتجات حالياً
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        <section className="border-t border-[#E8DCC3] pt-10">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="rounded-xl border border-[#E8DCC3] bg-[#FFFDF8] px-5 py-3 text-sm font-bold text-[#C9A84C] transition hover:border-[#C9A84C]"
              >
                {category.name_ar}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}