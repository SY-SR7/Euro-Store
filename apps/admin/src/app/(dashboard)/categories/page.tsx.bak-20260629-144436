import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { NewCategoryForm } from './NewCategoryForm';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const t = await getTranslations('adminCatalog');
  const tCommon = await getTranslations('common');
  const supabase = createServerSupabaseClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ar, name_en, slug, sort_order, is_active')
    .order('sort_order');

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <h1 className="text-3xl font-semibold mb-8">{t('categoriesTitle')}</h1>
        {(!categories || categories.length === 0) ? (
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center text-[#9CA3AF]">{t('noCategories')}</div>
        ) : (
          <div className="overflow-hidden rounded-md border border-[#2E2E2E]">
            <table className="w-full text-sm">
              <thead className="bg-[#161616] text-[#9CA3AF]">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('categoryNameAr')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('categoryNameEn')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('sortOrder')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('active')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]">
                {categories.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[#161616]">
                    <td className="px-4 py-3 text-[#E2E2E2]">{c.name_ar}</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">{c.name_en}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{c.sort_order}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${c.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {c.is_active ? tCommon('confirm') : tCommon('cancel')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('newCategory')}</h2>
        <NewCategoryForm />
      </div>
    </div>
  );
}



