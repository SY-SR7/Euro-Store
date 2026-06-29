// @ts-nocheck
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import Link from 'next/link';
import { AddVariantForm } from './AddVariantForm';
import { VariantRow } from './VariantRow';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

export default async function ProductVariantsPage({ params }: Props) {
  const t = await getTranslations('adminCatalog');
  const supabase = createServerSupabaseClient();

  const [productRes, variantsRes] = await Promise.all([
    supabase.from('products').select('id, name_ar').eq('id', params.id).single(),
    supabase
      .from('product_variants')
      .select('id, sku, price_syp, compare_price_syp, stock_quantity, is_active')
      .eq('product_id', params.id)
      .order('price_syp', { ascending: true }),
  ]);

  if (!productRes.data) notFound();

  const product  = productRes.data;
  const variants = variantsRes.data ?? [];

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/products/${product.id}/edit`}
          className="text-sm text-[#9CA3AF] hover:text-[#C9A84C] transition-colors">
           {product.name_ar}
        </Link>
      </div>
      <h1 className="mb-8 text-3xl font-semibold">{t('variantsTitle')}</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {variants.length === 0 ? (
            <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center text-[#9CA3AF]">
              لا توجد خيارات بعد — أضف أول خيار من النموذج
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-[#2E2E2E]">
              <table className="w-full text-sm">
                <thead className="bg-[#161616] text-[#9CA3AF]">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">SKU</th>
                    <th className="px-4 py-3 text-start font-medium">{t('priceSYP')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('comparePriceSYP')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('stockQty')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('active')}</th>
                    <th className="px-4 py-3 text-start font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E2E]">
                  {variants.map(v => (
                    <VariantRow key={v.id} variant={v} productId={product.id} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-6 text-xl font-semibold">{t('addVariant')}</h2>
          <AddVariantForm productId={product.id} />
        </div>
      </div>
    </div>
  );
}