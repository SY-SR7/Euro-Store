// @ts-nocheck
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/supabase-server';
import Link from 'next/link';
import { AddVariantForm } from './AddVariantForm';
import { VariantRow } from './VariantRow';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

export default async function ProductVariantsPage({ params }: Props) {
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
    <div className="max-w-5xl space-y-6" dir="rtl">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/products" className="text-[#B8860B] hover:underline">المنتجات</Link>
        <span className="text-[#A8A29E]">/</span>
        <Link href={`/products/${product.id}`} className="text-[#B8860B] hover:underline">{product.name_ar}</Link>
        <span className="text-[#A8A29E]">/</span>
        <span className="text-[#57534E]">الخيارات</span>
      </div>

      <h1 className="text-2xl font-black text-[#1C1917]">إدارة خيارات المنتج</h1>
      <p className="text-sm text-[#A8A29E]">كل خيار يمثل تركيبة مختلفة (لون، مقاس، إلخ) مع سعرها ومخزونها المستقل.</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Table */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0ECE6]">
            <h2 className="font-black text-[#1C1917]">الخيارات الحالية ({variants.length})</h2>
          </div>
          {variants.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#A8A29E]">
              لا توجد خيارات بعد — أضف أول خيار من النموذج
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F8F6F2]">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-black text-[#A8A29E]">SKU</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-[#A8A29E]">السعر (ل.س)</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-[#A8A29E]">سعر المقارنة</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-[#A8A29E]">المخزون</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-[#A8A29E]">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-[#A8A29E]">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(v => (
                    <VariantRow key={v.id} variant={v} productId={product.id} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add form */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm h-fit">
          <h2 className="mb-5 text-lg font-black text-[#1C1917]">إضافة خيار جديد</h2>
          <AddVariantForm productId={product.id} />
        </div>
      </div>
    </div>
  );
}