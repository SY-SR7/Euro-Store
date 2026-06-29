// @ts-nocheck
import { createAdminSupabaseClient } from '@/supabase-server';
import { ProductCard } from '../../catalog-components';
import { createCatalogLookup } from '../../catalog-types';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams?: { q?: string; category?: string } }) {
  const supabase = createAdminSupabaseClient();
  const q = searchParams?.q?.trim() ?? '';
  const categorySlug = searchParams?.category?.trim() ?? '';

  const [categoriesRes, brandsRes, variantsRes] = await Promise.all([
    supabase.from('categories').select('id,name_ar,name_en,slug,sort_order,is_active').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id,name,slug,is_active').eq('is_active', true).order('name'),
    supabase.from('product_variants').select('id,product_id,sku,price_syp,compare_price_syp,stock_quantity,is_active').eq('is_active', true),
  ]);

  const categories = categoriesRes.data ?? [];
  const brands = brandsRes.data ?? [];
  const variants = variantsRes.data ?? [];
  const category = categorySlug ? categories.find((item) => item.slug === categorySlug) : null;

  let query = supabase
    .from('products')
    .select('id,name_ar,name_en,slug,description_ar,description_en,category_id,brand_id,is_featured,is_active,image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category?.id) query = query.eq('category_id', category.id);
  if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,description_ar.ilike.%${q}%`);

  const productsRes = await query;
  const products = productsRes.data ?? [];

  const categoryLookup = createCatalogLookup(categories);
  const brandLookup = createCatalogLookup(brands);

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-6 py-12 text-[#1F1B16]" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="text-right">
          <p className="text-sm font-bold text-[#C9A84C]">التصنيفات</p>
          <h1 className="mt-3 text-5xl font-black">المنتجات</h1>

          <form className="mt-8 flex max-w-xl gap-3">
            <button className="rounded-xl bg-[#C9A84C] px-6 py-3 font-black text-[#1F1B16]">بحث</button>
            <input
              name="q"
              defaultValue={q}
              placeholder="إبحث عن المنتجات"
              className="min-w-0 flex-1 rounded-xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#C9A84C]"
            />
          </form>

          <div className="mt-8 flex flex-wrap justify-end gap-2">
            <a href="/products" className="rounded-lg border border-[#C9A84C] px-4 py-2 text-sm font-bold text-[#C9A84C]">الكل</a>
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="rounded-lg border border-[#E8DCC3] px-4 py-2 text-sm font-bold text-[#C9A84C]"
              >
                {cat.name_ar}
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black">{category ? category.name_ar : 'كل المنتجات'}</h2>
          <p className="mt-2 text-sm text-[#6F6658]">عدد المنتجات: {products.length}</p>

          {products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-12 text-center text-[#6F6658]">
              لا توجد منتجات حالياً
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