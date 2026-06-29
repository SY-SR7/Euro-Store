// @ts-nocheck
import Link from 'next/link';
import { createAdminSupabaseClient } from '@/supabase-server';
import { ScrollCategoryShowcase } from '@/components/home/ScrollCategoryShowcase';

export const dynamic = 'force-dynamic';

const CATEGORY_ORDER = ['shoes', 'bags', 'dresses', 'abayas', 'accessories', 'perfumes'];

export default async function HomePage() {
  const supabase = createAdminSupabaseClient();

  const [categoriesRes, productsRes, variantsRes, brandsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id,name_ar,name_en,slug,sort_order,is_active')
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('products')
      .select('id,name_ar,name_en,slug,description_ar,description_en,category_id,brand_id,is_featured,is_active,image_url')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase
      .from('product_variants')
      .select('id,product_id,sku,price_syp,compare_price_syp,stock_quantity,is_active')
      .eq('is_active', true),

    supabase
      .from('brands')
      .select('id,name,slug,is_active')
      .eq('is_active', true)
      .order('name'),
  ]);

  const categories = categoriesRes.data ?? [];
  const products = productsRes.data ?? [];
  const variants = variantsRes.data ?? [];
  const brands = brandsRes.data ?? [];

  const orderedCategories = [...categories].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.slug);
    const bIndex = CATEGORY_ORDER.indexOf(b.slug);

    const safeA = aIndex === -1 ? 999 : aIndex;
    const safeB = bIndex === -1 ? 999 : bIndex;

    if (safeA !== safeB) return safeA - safeB;
    return Number(a.sort_order ?? 999) - Number(b.sort_order ?? 999);
  });

  const sections = orderedCategories.map((category) => {
    const categoryProducts = products.filter((product) => product.category_id === category.id);
    const introProduct = categoryProducts[0] ?? null;

    return {
      category,
      products: categoryProducts,
      introProduct,
      introVideoSrc: category.slug === 'shoes' ? '/videos/shoes-intro.mp4' : null,
    };
  });

  return (
    <main className="min-h-screen bg-[#FAF7EF] text-[#1F1B16]" dir="rtl">
      <section className="mx-auto flex min-h-[82vh] max-w-7xl flex-col justify-center px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="text-right">
            <p className="text-sm font-bold text-[#C9A84C]">تجربة تسوق تفاعلية</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight lg:text-7xl">
              كل قسم يبدأ بمشهد بصري يتحرك مع السكرول
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6F6658]">
              ابدأ بقسم الأحذية، وعند وصول الفيديو إلى منتصف الشاشة يتحول السكرول إلى تحكم مباشر بالفيديو.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#E8DCC3] bg-[#FFFDF8] p-6 shadow-xl">
            <p className="text-sm font-bold text-[#C9A84C]">الأقسام</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sections.map((section) => (
                <a
                  key={section.category.id}
                  href={`#section-${section.category.slug}`}
                  className="rounded-xl border border-[#E8DCC3] px-4 py-2 text-sm font-bold text-[#6F6658] transition hover:border-[#C9A84C] hover:text-[#C9A84C]"
                >
                  {section.category.name_ar}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Link
            href="#section-shoes"
            className="inline-flex rounded-xl bg-[#C9A84C] px-8 py-4 font-black text-[#1F1B16] transition hover:bg-[#D8B95F]"
          >
            ابدأ من قسم الأحذية
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6">
        <ScrollCategoryShowcase sections={sections} variants={variants} brands={brands} />
      </div>
    </main>
  );
}