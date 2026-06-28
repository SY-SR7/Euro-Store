import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { NewBrandForm } from './NewBrandForm';

export const dynamic = 'force-dynamic';

export default async function AdminBrandsPage() {
  const t = await getTranslations('adminCatalog');
  const tCommon = await getTranslations('common');
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data: brands } = await supabase.from('brands').select('id, name, slug, is_active').order('name');

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <h1 className="text-3xl font-semibold mb-8">{t('brandsTitle')}</h1>
        {(!brands || brands.length === 0) ? (
          <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center text-[#9CA3AF]">{t('noBrands')}</div>
        ) : (
          <div className="overflow-hidden rounded-md border border-[#2E2E2E]">
            <table className="w-full text-sm">
              <thead className="bg-[#161616] text-[#9CA3AF]">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('brandName')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('brandSlug')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('active')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-[#161616]">
                    <td className="px-4 py-3 text-[#E2E2E2]">{b.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{b.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${b.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {b.is_active ? tCommon('confirm') : tCommon('cancel')}
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
        <h2 className="text-xl font-semibold mb-6">{t('newBrand')}</h2>
        <NewBrandForm />
      </div>
    </div>
  );
}
