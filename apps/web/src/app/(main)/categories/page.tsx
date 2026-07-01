/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage(): Promise<JSX.Element> {
  const t = await getTranslations();
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const supabase = createServerSupabaseClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ar, name_en, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

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

        {(!categories || categories.length === 0) ? (
          <div className="rounded-md border border-border bg-background-card p-12 text-center text-[#6F6658]">
            {t('catalog.noProducts')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-background-card p-8 text-center hover:border-primary/40 hover:bg-background-secondary transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-xl">✦</span>
                </div>
                <p className="text-sm font-medium text-[#1F1B16] group-hover:text-primary transition-colors">
                  {isAr ? cat.name_ar : (cat.name_en || cat.name_ar)}
                </p>
              </Link>
            ))}
          </div>
        )}

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
