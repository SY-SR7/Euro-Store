// @ts-nocheck
import { createServerSupabaseClient } from '@/supabase-server';
import { ProductCard } from '../../catalog-components';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams?: { q?: string; category?: string } }) {
  const supabase = createServerSupabaseClient();
  const q = searchParams?.q?.trim() ?? '';
  const categorySlug = searchParams?.category?.trim() ?? '';

  const [categoriesRes, brandsRes] = await Promise.all([
    supabase.from('categories').select('id,name_ar,name_en,slug').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id,name,slug').eq('is_active', true).order('name'),
  ]);

  const categories = categoriesRes.data ?? [];
  const brands = brandsRes.data ?? [];
  const category = categorySlug ? categories.find((c: any) => c.slug === categorySlug) : null;

  let query = supabase
    .from('products')
    .select('id,name_ar,name_en,slug,description_ar,category_id,brand_id,is_featured,is_active,image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category?.id) query = query.eq('category_id', category.id);
  if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%`);

  const productsRes = await query;
  const products = productsRes.data ?? [];

  // Add min price per product
  let priceMap: Record<string, number> = {};
  if (products.length > 0) {
    const ids = products.map((p: any) => p.id);
    const { data: variants } = await supabase
      .from('product_variants')
      .select('product_id,price_syp')
      .in('product_id', ids)
      .eq('is_active', true);
    for (const v of (variants ?? [])) {
      const cur = priceMap[v.product_id];
      if (!cur || v.price_syp < cur) priceMap[v.product_id] = v.price_syp;
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-4 py-12 text-[#1F1B16]" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="text-right">
          <p className="text-sm font-bold text-[#C9A84C] uppercase tracking-widest">المنتجات</p>
          <h1 className="mt-2 text-4xl font-black">تشكيلتنا الكاملة</h1>
        </div>

        <form className="flex max-w-xl gap-3">
          <button className="rounded-xl bg-[#C9A84C] px-6 py-3 font-black text-white text-sm">بحث</button>
          <input name="q" defaultValue={q} placeholder="إبحث عن المنتجات..." className="min-w-0 flex-1 rounded-xl border border-[#E8DCC3] bg-white px-4 py-3 text-sm outline-none focus:border-[#C9A84C]" />
        </form>

        <div className="flex flex-wrap gap-2">
          <a href="/products" className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${!categorySlug ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'border-[#E8DCC3] text-[#57534E] hover:border-[#C9A84C] hover:text-[#C9A84C]'}`}>الكل</a>
          {categories.map((cat: any) => (
            <a key={cat.id} href={`/products?category=${cat.slug}`} className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${categorySlug===cat.slug ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'border-[#E8DCC3] text-[#57534E] hover:border-[#C9A84C] hover:text-[#C9A84C]'}`}>{cat.name_ar}</a>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-[#E8DCC3] bg-white p-12 text-center text-[#6F6658]">لا توجد منتجات {q ? `تطابق "${q}"` : 'في هذا التصنيف'}</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} minPrice={priceMap[product.id]} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}