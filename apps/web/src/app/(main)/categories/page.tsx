import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

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
    <main className="min-h-screen bg-background text-[#1F1B16] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8">
          <Link href="/" className="text-primary text-sm hover:underline">
             {t('common.appName')}
          </Link>
        </nav>

        <h1 className="text-3xl font-semibold mb-2">{t('nav.categories')}</h1>
        <p className="text-[#6F6658] text-sm mb-10">{t('catalog.catalogTag')}</p>

        {mainCategories.length === 0 ? (
          <div className="rounded-md border border-border bg-background-card p-12 text-center text-[#6F6658]">
            {t('catalog.noProducts')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mainCategories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group overflow-hidden rounded-lg border border-border bg-background-card transition-colors hover:border-primary/50"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-background-secondary">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={isAr ? category.name_ar : (category.name_en || category.name_ar)}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-3xl text-primary" aria-hidden="true">✦</span>
                  )}
                </div>
                <p className="px-5 py-4 text-base font-bold text-[#1F1B16] transition-colors group-hover:text-primary">
                  {isAr ? category.name_ar : (category.name_en || category.name_ar)}
                </p>
              </Link>
            ))}
          </div>
        )}

        {subcategories.length > 0 ? (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="mb-5 text-xl font-semibold">{isAr ? 'التصنيفات الفرعية' : 'Subcategories'}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {subcategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="flex min-h-24 items-center justify-center rounded-lg border border-border bg-background-card px-4 text-center text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {isAr ? category.name_ar : (category.name_en || category.name_ar)}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-block rounded-sm border border-border px-6 py-2.5 text-sm text-[#6F6658] hover:border-primary hover:text-[#1F1B16] transition-colors"
          >
            {t('catalog.allProducts')}
          </Link>
        </div>
      </div>
    </main>
  );
}
