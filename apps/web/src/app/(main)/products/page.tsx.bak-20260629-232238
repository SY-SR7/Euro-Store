// @ts-nocheck
/* eslint-disable */
import { createServerSupabaseClient } from '@/supabase-server';
import { ProductCard } from '../../catalog-components';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams?: { q?: string; category?: string; brand?: string; featured?: string } }) {
  const supabase = createServerSupabaseClient();
  const q             = searchParams?.q?.trim() ?? '';
  const categorySlug  = searchParams?.category?.trim() ?? '';
  const brandSlug     = searchParams?.brand?.trim() ?? '';
  const featuredOnly  = searchParams?.featured === '1';

  const [categoriesRes, brandsRes] = await Promise.all([
    supabase.from('categories').select('id,name_ar,name_en,slug').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id,name,slug').eq('is_active', true).order('name'),
  ]);

  const categories = categoriesRes.data ?? [];
  const brands     = brandsRes.data ?? [];
  const category   = categorySlug ? categories.find((c: any) => c.slug === categorySlug) : null;
  const brand      = brandSlug ? brands.find((b: any) => b.slug === brandSlug) : null;

  let query = supabase
    .from('products')
    .select('id,name_ar,name_en,slug,description_ar,category_id,brand_id,is_featured,is_active,image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category?.id)  query = query.eq('category_id', category.id);
  if (brand?.id)     query = query.eq('brand_id', brand.id);
  if (featuredOnly)  query = query.eq('is_featured', true);
  if (q)             query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%`);

  const productsRes = await query;
  const products    = productsRes.data ?? [];

  // Min price per product
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

  const hasFilters = q || categorySlug || brandSlug || featuredOnly;

  return (
    <main className="min-h-screen bg-[#FAF7EF] px-4 py-12 text-[#1F1B16]" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest">المنتجات</p>
          <h1 className="mt-2 text-4xl font-black">تشكيلتنا الكاملة</h1>
          <p className="mt-1 text-sm text-[#6F6658]">{products.length} منتج</p>
        </div>

        {/* Search */}
        <form className="flex max-w-xl gap-3">
          <button className="rounded-xl bg-[#C9A84C] px-6 py-3 font-black text-white text-sm hover:bg-[#B8860B] transition-colors">بحث</button>
          <input name="q" defaultValue={q} placeholder="ابحث عن منتج..." className="min-w-0 flex-1 rounded-xl border border-[#E8DCC3] bg-white px-4 py-3 text-sm outline-none focus:border-[#C9A84C]" />
        </form>

        {/* Category filters */}
        <div>
          <p className="mb-2 text-xs font-bold text-[#A8A29E] uppercase tracking-wider">التصنيفات</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/products" className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${!categorySlug && !brandSlug && !featuredOnly ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'border-[#E8DCC3] text-[#57534E] hover:border-[#C9A84C] hover:text-[#C9A84C]'}`}>
              الكل
            </Link>
            <Link href="/products?featured=1" className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${featuredOnly ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'border-[#E8DCC3] text-[#57534E] hover:border-[#C9A84C] hover:text-[#C9A84C]'}`}>
              ⭐ المميزة
            </Link>
            {categories.map((cat: any) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`} className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${categorySlug === cat.slug ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'border-[#E8DCC3] text-[#57534E] hover:border-[#C9A84C] hover:text-[#C9A84C]'}`}>
                {cat.name_ar}
              </Link>
            ))}
          </div>
        </div>

        {/* Brand filters */}
        {brands.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold text-[#A8A29E] uppercase tracking-wider">العلامات التجارية</p>
            <div className="flex flex-wrap gap-2">
              {brands.map((b: any) => (
                <Link key={b.id} href={`/products?brand=${b.slug}`} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${brandSlug === b.slug ? 'bg-[#1F1B16] text-white border-[#1F1B16]' : 'border-[#E8DCC3] text-[#57534E] hover:border-[#1F1B16]'}`}>
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products grid */}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-[#E8DCC3] bg-white p-16 text-center">
            <p className="text-xl text-[#6F6658]">{q ? `لا توجد نتائج لـ "${q}"` : 'لا توجد منتجات في هذا التصنيف'}</p>
            {hasFilters && (
              <Link href="/products" className="mt-4 inline-block text-sm text-[#C9A84C] hover:underline">عرض جميع المنتجات</Link>
            )}
          </div>
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