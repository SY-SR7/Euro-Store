import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/supabase-server';
import { Sparkles, ArrowLeft, ArrowRight, LayoutGrid } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'كافة التصنيفات والأقسام | يورو ستور',
  description: 'استكشف كافة أقسام وتصنيفات يورو ستور: الأحذية والسنيكرز، الملابس، العطور، الساعات، الإكسسوارات، والجلديات.',
};

export default async function CategoriesPage(): Promise<JSX.Element> {
  const t = await getTranslations();
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const supabase = createPublicSupabaseClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ar, name_en, slug, image_url, parent_id')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const mainCategories = (categories ?? []).filter((category) => !category.parent_id);
  const subcategories = (categories ?? []).filter((category) => category.parent_id);

  return (
    <div className="w-full text-[#1F1B16] px-4 py-8 md:py-12" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Luxury Categories Header */}
        <div className="relative overflow-hidden rounded-3xl border border-[#E8DFC8] bg-gradient-to-br from-[#FFFDF9] via-[#FAF6ED] to-[#F5EFE0] p-8 md:p-12 shadow-sm">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-black text-primary mb-4">
              <LayoutGrid className="h-4 w-4" />
              <span>{isAr ? 'دليل الأقسام والتصنيفات' : 'Departments Directory'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1F1B16] leading-tight">
              {isAr ? 'كافة التصنيفات والأقسام الفاخرة' : 'Explore All Luxury Categories'}
            </h1>
            <p className="mt-3 text-sm md:text-base text-[#6F6658] leading-relaxed">
              {isAr
                ? 'تصفح مجموعاتنا الكاملة عبر الأقسام الرئيسية والفرعية للعثور على المنتجات والماركات المفضلة لديك بكل سهولة.'
                : 'Browse our full collections across departments to find your favorite luxury products and authentic global brands.'}
            </p>
          </div>
        </div>

        {/* Main Department Cards */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-[#1F1B16]">
              {isAr ? 'الأقسام الرئيسية' : 'Main Departments'}
            </h2>
            <Link
              href="/products"
              className="text-xs sm:text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>{isAr ? 'عرض كافة المنتجات' : 'View All Products'}</span>
              {isAr ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mainCategories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E8DFC8] bg-white p-4 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#FAF6EE] flex items-center justify-center p-4">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={isAr ? category.name_ar : (category.name_en || category.name_ar)}
                      fill
                      className="object-contain p-2 transition-transform duration-500 group-hover:scale-108"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <span className="text-4xl text-primary font-black">✦</span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <h3 className="text-base font-black text-[#1F1B16] group-hover:text-primary transition-colors">
                    {isAr ? category.name_ar : (category.name_en || category.name_ar)}
                  </h3>
                  <span className="rounded-full bg-[#FAF6EE] px-2.5 py-1 text-[11px] font-bold text-primary border border-[#E8DFC8]">
                    {isAr ? 'تصفح' : 'Explore'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Subcategories Section */}
        {subcategories.length > 0 && (
          <div className="border-t border-[#E8DFC8] pt-10">
            <h2 className="mb-6 text-xl sm:text-2xl font-black text-[#1F1B16]">
              {isAr ? 'التصنيفات الفرعية والتخصصية' : 'Specialized Subcategories'}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {subcategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="flex min-h-[4rem] items-center justify-center rounded-xl border border-[#E8DFC8] bg-white px-4 py-3 text-center text-xs sm:text-sm font-bold text-[#1F1B16] transition-all hover:border-primary hover:bg-[#FAF6EE] hover:text-primary shadow-xs"
                >
                  {isAr ? category.name_ar : (category.name_en || category.name_ar)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
