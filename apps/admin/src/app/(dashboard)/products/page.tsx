import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const t = await getTranslations('adminCatalog');
  const tCommon = await getTranslations('common');
  const supabase = createServerSupabaseClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name_ar, name_en, slug, is_featured, is_active, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">{t('pageTitle')}</h1>
        <Link
          href="/products/new"
          className="rounded-sm bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors"
        >
          + {t('newProduct')}
        </Link>
      </div>

      {(!products || products.length === 0) ? (
        <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center text-[#9CA3AF]">
          {t('noProducts')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#2E2E2E]">
          <table className="w-full text-sm">
            <thead className="bg-[#161616] text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('productNameAr')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('productNameEn')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('productSlug')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('featured')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('active')}</th>
                <th className="px-4 py-3 text-start font-medium">{tCommon('edit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-[#161616] transition-colors">
                  <td className="px-4 py-3 text-[#E2E2E2]">{p.name_ar}</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{p.name_en}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{p.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${p.is_featured ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-[#6B7280]'}`}>
                      {p.is_featured ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${p.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {p.is_active ? tCommon('confirm') : tCommon('cancel')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.id}/edit`} className="text-[#C9A84C] hover:underline text-xs">
                      {tCommon('edit')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

