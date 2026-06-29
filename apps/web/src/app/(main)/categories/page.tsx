/* eslint-disable */
// @ts-nocheck
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage(): Promise<JSX.Element> {
  const t = await getTranslations();
  const supabase = createServerSupabaseClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ar, name_en, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline">
             {t('common.appName')}
          </Link>
        </nav>

        <h1 className="text-3xl font-semibold mb-2">{t('nav.categories')}</h1>
        <p className="text-[#9CA3AF] text-sm mb-10">{t('catalog.catalogTag')}</p>

        {(!categories || categories.length === 0) ? (
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-12 text-center text-[#9CA3AF]">
            {t('catalog.noProducts')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col items-center justify-center gap-3 rounded-lg border border-[#2E2E2E] bg-[#151515] p-8 text-center hover:border-[#C9A84C]/40 hover:bg-[#1A1A1A] transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
                  <span className="text-[#C9A84C] text-xl">✦</span>
                </div>
                <p className="text-sm font-medium text-[#E2E2E2] group-hover:text-[#C9A84C] transition-colors">
                  {cat.name_ar}
                </p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-block rounded-sm border border-[#2E2E2E] px-6 py-2.5 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#E2E2E2] transition-colors"
          >
            {t('catalog.allProducts')}
          </Link>
        </div>
      </div>
    </main>
  );
}
