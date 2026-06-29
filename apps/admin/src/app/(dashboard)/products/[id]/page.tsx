// @ts-nocheck
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';
interface Props { params: { id: string } }

export default async function ProductHubPage({ params }: Props) {
  const supabase = createServerSupabaseClient();

  const { data: product } = await supabase
    .from('products')
    .select(`
      id, name_ar, name_en, slug, description_ar, is_active, is_featured,
      categories(name_ar),
      brands(name),
      product_variants(id, sku, price_syp, stock_quantity, is_active),
      product_images(id, url, is_primary)
    `)
    .eq('id', params.id)
    .single();

  if (!product) notFound();

  const variants = (product['product_variants'] ?? []) as Array<{ id: string; sku: string; price_syp: number; stock_quantity: number; is_active: boolean }>;
  const images   = (product['product_images']   ?? []) as Array<{ id: string; url: string; is_primary: boolean }>;
  const category = (product['categories']) as { name_ar: string } | null;
  const brand    = (product['brands'])     as { name: string }    | null;

  const totalStock = variants.reduce((s, v) => s + (v.stock_quantity ?? 0), 0);
  const minPrice   = variants.length > 0 ? Math.min(...variants.map(v => v.price_syp)) : 0;

  const card  = 'rounded-3xl border border-white/10 bg-[#101010] p-5 shadow-2xl';
  const label = 'text-xs text-[#9CA3AF] mt-1';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#101010] p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/products" className="text-sm text-[#9CA3AF] hover:text-[#C9A84C] transition-colors"> المنتجات</Link>
          <h1 className="mt-1 text-2xl font-black text-white">{product.name_ar}</h1>
          <p className="text-sm text-[#9CA3AF]">{product.name_en}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/products/${params.id}/edit`}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-[#EDE7DD] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
            تعديل المعلومات
          </Link>
          <Link href={`/products/${params.id}/variants`}
            className="rounded-2xl bg-[#C9A84C] px-4 py-2 text-sm font-bold text-[#111] hover:bg-[#D8B95F] transition-colors">
            المتغيرات والأسعار
          </Link>
          <Link href={`/products/${params.id}/images`}
            className="rounded-2xl border border-[#C9A84C]/30 px-4 py-2 text-sm font-bold text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors">
            إدارة الصور
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className={card + ' text-center'}>
          <p className="text-3xl font-black text-[#C9A84C]">{variants.length}</p>
          <p className={label}>المتغيرات</p>
        </div>
        <div className={card + ' text-center'}>
          <p className="text-3xl font-black text-[#C9A84C]">{totalStock}</p>
          <p className={label}>إجمالي المخزون</p>
        </div>
        <div className={card + ' text-center'}>
          <p className="text-2xl font-black text-[#C9A84C]">{minPrice > 0 ? minPrice.toLocaleString('ar-SY') : '—'}</p>
          <p className={label}>أدنى سعر (ل.س)</p>
        </div>
        <div className={card + ' text-center flex flex-col items-center justify-center'}>
          <span className={['rounded-full border px-3 py-1 text-xs font-black', product.is_active ? 'border-green-400/20 bg-green-400/10 text-green-200' : 'border-red-400/20 bg-red-400/10 text-red-200'].join(' ')}>
            {product.is_active ? 'نشط' : 'معطّل'}
          </span>
          <p className={label}>الحالة</p>
        </div>
      </div>

      {/* Details */}
      <div className={card + ' space-y-3 text-sm'}>
        <h2 className="font-black text-[#C9A84C]">تفاصيل المنتج</h2>
        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-[#9CA3AF]">التصنيف</span><span className="text-[#EDE7DD]">{category?.name_ar ?? '—'}</span></div>
        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-[#9CA3AF]">الماركة</span><span className="text-[#EDE7DD]">{brand?.name ?? '—'}</span></div>
        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-[#9CA3AF]">slug</span><span className="font-mono text-xs text-[#9CA3AF]">{product.slug}</span></div>
        <div className="flex justify-between"><span className="text-[#9CA3AF]">مميّز</span><span className="text-[#EDE7DD]">{product.is_featured ? '✓ نعم' : '—'}</span></div>
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div className={card + ' space-y-4'}>
          <div className="flex items-center justify-between">
            <h2 className="font-black text-[#C9A84C]">الصور ({images.length})</h2>
            <Link href={`/products/${params.id}/images`} className="text-xs text-[#C9A84C] hover:underline">إدارة الصور</Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {images.map(img => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className={['h-20 w-20 rounded-xl object-cover border-2', img.is_primary ? 'border-[#C9A84C]' : 'border-white/10'].join(' ')} />
                {img.is_primary && <span className="absolute -top-1 -right-1 rounded-full bg-[#C9A84C] px-1.5 py-0.5 text-[9px] font-black text-[#111]">رئيسية</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variants table */}
      {variants.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-black text-[#C9A84C]">المتغيرات والأسعار</h2>
            <Link href={`/products/${params.id}/variants`} className="text-xs text-[#C9A84C] hover:underline">إدارة المتغيرات</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-[#9CA3AF]">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">SKU</th>
                  <th className="px-4 py-3 text-right font-medium">السعر (ل.س)</th>
                  <th className="px-4 py-3 text-right font-medium">المخزون</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {variants.map(v => (
                  <tr key={v.id} className="text-[#EDE7DD] hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{v.sku}</td>
                    <td className="px-4 py-3 font-bold text-[#C9A84C]">{v.price_syp.toLocaleString('ar-SY')}</td>
                    <td className="px-4 py-3">{v.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <span className={['rounded-full border px-2 py-0.5 text-xs font-bold', v.is_active ? 'border-green-400/20 bg-green-400/10 text-green-200' : 'border-red-400/20 bg-red-400/10 text-red-200'].join(' ')}>
                        {v.is_active ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}