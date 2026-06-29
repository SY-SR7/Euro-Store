/* apps/admin/src/app/(dashboard)/products/[id]/page.tsx */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

export default async function ProductHubPage({ params }: Props) {
  const t = await getTranslations();
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

  const variants = ((product as unknown as Record<string,unknown>)['product_variants'] ?? []) as Array<{
    id: string; sku: string; price_syp: number; stock_quantity: number; is_active: boolean;
  }>;
  const images = ((product as unknown as Record<string,unknown>)['product_images'] ?? []) as Array<{
    id: string; url: string; is_primary: boolean;
  }>;
  const category = ((product as unknown as Record<string,unknown>)['categories']) as { name_ar: string } | null;
  const brand    = ((product as unknown as Record<string,unknown>)['brands']) as { name: string } | null;

  const totalStock = variants.reduce((s, v) => s + (v.stock_quantity ?? 0), 0);
  const minPrice   = variants.length > 0 ? Math.min(...variants.map(v => v.price_syp)) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/products" className="text-sm text-gray-500 hover:underline"> المنتجات</Link>
          <h1 className="text-2xl font-bold mt-1">{product.name_ar}</h1>
          <p className="text-gray-500 text-sm">{product.name_en}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/products/${params.id}/edit`}
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            تعديل
          </Link>
          <Link
            href={`/products/${params.id}/variants`}
            className="px-4 py-2 bg-primary text-white rounded text-sm"
          >
            المتغيرات
          </Link>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded border p-4 text-center">
          <p className="text-2xl font-bold">{variants.length}</p>
          <p className="text-xs text-gray-500 mt-1">المتغيرات</p>
        </div>
        <div className="bg-white rounded border p-4 text-center">
          <p className="text-2xl font-bold">{totalStock}</p>
          <p className="text-xs text-gray-500 mt-1">إجمالي المخزون</p>
        </div>
        <div className="bg-white rounded border p-4 text-center">
          <p className="text-2xl font-bold">{minPrice.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">أدنى سعر (ل.س)</p>
        </div>
        <div className="bg-white rounded border p-4 text-center">
          <span className={`px-2 py-1 rounded text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {product.is_active ? 'نشط' : 'معطّل'}
          </span>
          <p className="text-xs text-gray-500 mt-1">الحالة</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded border p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">الفئة</span><span>{category?.name_ar ?? '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">الماركة</span><span>{brand?.name ?? '—'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">slug</span><span className="font-mono">{product.slug}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">مميّز</span><span>{product.is_featured ? 'نعم' : 'لا'}</span></div>
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">الصور</h2>
            <Link href={`/products/${params.id}/images`} className="text-sm text-primary hover:underline">إدارة الصور</Link>
          </div>
          <div className="flex gap-2 flex-wrap">
            {images.map(img => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className={`h-20 w-20 object-cover rounded border-2 ${img.is_primary ? 'border-primary' : 'border-transparent'}`}
                />
                {img.is_primary && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-[9px] px-1 rounded-bl">رئيسية</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variants table */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">المتغيرات</h2>
            <Link href={`/products/${params.id}/variants`} className="text-sm text-primary hover:underline">إدارة المتغيرات</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-right text-gray-500">
                  <th className="p-2 border">SKU</th>
                  <th className="p-2 border">السعر (ل.س)</th>
                  <th className="p-2 border">المخزون</th>
                  <th className="p-2 border">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {variants.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="p-2 border font-mono">{v.sku}</td>
                    <td className="p-2 border">{v.price_syp.toLocaleString()}</td>
                    <td className="p-2 border">{v.stock_quantity}</td>
                    <td className="p-2 border">
                      <span className={`px-2 py-0.5 rounded text-xs ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
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
