/* apps/admin/src/app/(dashboard)/products/[id]/page.tsx */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

export default async function ProductHubPage({ params }: Props) {
  const t = await getTranslations();
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);

  const { data: product } = await supabase
    .from('products')
    .select(`
      id, name_ar, name_en, slug, description_ar, is_active, is_featured,
      categories(name_ar),
      brands(name),
      product_variants(id, sku, price_syp, stock_quantity, is_active),
      product_images(id, image_url, is_primary)
    `)
    .eq('id', params.id)
    .single();

  if (!product) notFound();

  const variants = (product.product_variants ?? []) as Array<{
    id: string; sku: string; price_syp: number; stock_quantity: number; is_active: boolean;
  }>;
  const images = (product.product_images ?? []) as Array<{
    id: string; image_url: string; is_primary: boolean;
  }>;
  const category = product.categories as { name_ar: string } | null;
  const brand    = product.brands    as { name: string }     | null;

  const totalStock = variants.reduce((s, v) => s + (v.stock_quantity ?? 0), 0);
  const minPrice   = variants.length > 0 ? Math.min(...variants.map(v => v.price_syp)) : 0;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-[#9CA3AF]">
        <Link href="/products" className="hover:text-[#C9A84C] transition-colors">
          {t('adminCatalog.products')}
        </Link>
        <span>/</span>
        <span className="text-[#E2E2E2]">{product.name_ar}</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#E2E2E2]">{product.name_ar}</h1>
          {product.name_en && (
            <p className="mt-1 text-sm text-[#9CA3AF]" dir="ltr">{product.name_en}</p>
          )}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className={`rounded-sm px-2.5 py-1 text-xs font-medium ${product.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              {product.is_active ? t('common.active') : t('common.inactive')}
            </span>
            {product.is_featured && (
              <span className="rounded-sm bg-[#C9A84C]/10 px-2.5 py-1 text-xs font-medium text-[#C9A84C]">
                ★ مميز
              </span>
            )}
            {category && (
              <span className="text-xs text-[#9CA3AF]">📁 {category.name_ar}</span>
            )}
            {brand && (
              <span className="text-xs text-[#9CA3AF]">🏷 {brand.name}</span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/products/${params.id}/edit`}
            className="rounded-md border border-[#2E2E2E] px-4 py-2 text-sm text-[#E2E2E2] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
          >
            {t('common.edit')}
          </Link>
          <Link
            href={`/products/${params.id}/variants`}
            className="rounded-md border border-[#2E2E2E] px-4 py-2 text-sm text-[#E2E2E2] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
          >
            {t('adminCatalog.variants')}
          </Link>
          <Link
            href={`/products/${params.id}/images`}
            className="rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors"
          >
            {t('adminCatalog.images')}
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'المتغيرات',    value: variants.length.toString(),                         color: 'text-[#C9A84C]'  },
          { label: 'المخزون الكلي', value: totalStock.toLocaleString('ar-SY'),                color: totalStock > 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'أقل سعر',     value: minPrice > 0 ? `${minPrice.toLocaleString('ar-SY')} ل.س` : '—', color: 'text-blue-400' },
        ].map(card => (
          <div key={card.label} className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-4">
            <p className="text-xs text-[#9CA3AF]">{card.label}</p>
            <p className={`mt-1 text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Description ── */}
      {product.description_ar && (
        <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
          <h2 className="mb-2 text-sm font-semibold text-[#9CA3AF]">الوصف</h2>
          <p className="text-sm text-[#D6D3C7] leading-7">{product.description_ar}</p>
        </div>
      )}

      {/* ── Images preview ── */}
      {images.length > 0 && (
        <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#9CA3AF]">الصور ({images.length})</h2>
            <Link href={`/products/${params.id}/images`} className="text-xs text-[#C9A84C] hover:underline">
              إدارة الصور
            </Link>
          </div>
          <div className="flex gap-3 flex-wrap">
            {images.map(img => (
              <div key={img.id} className="relative">
                <img
                  src={img.image_url}
                  alt=""
                  className="h-20 w-20 rounded-md object-cover border border-[#2E2E2E]"
                />
                {img.is_primary && (
                  <span className="absolute -top-1 -end-1 rounded-full bg-[#C9A84C] px-1 py-0.5 text-[9px] text-[#111] font-bold">
                    رئيسية
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Variants table ── */}
      <div className="rounded-lg border border-[#2E2E2E] bg-[#151515] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#9CA3AF]">المتغيرات ({variants.length})</h2>
          <Link href={`/products/${params.id}/variants`} className="text-xs text-[#C9A84C] hover:underline">
            إدارة المتغيرات
          </Link>
        </div>
        {variants.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">{t('common.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[#9CA3AF] text-xs">
                <tr className="border-b border-[#2E2E2E]">
                  <th className="pb-2 text-start font-medium">SKU</th>
                  <th className="pb-2 text-start font-medium">السعر</th>
                  <th className="pb-2 text-start font-medium">المخزون</th>
                  <th className="pb-2 text-start font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E]">
                {variants.map(v => (
                  <tr key={v.id}>
                    <td className="py-2 font-mono text-xs text-[#C9A84C]">{v.sku}</td>
                    <td className="py-2 text-[#D6D3C7]">{v.price_syp.toLocaleString('ar-SY')} ل.س</td>
                    <td className={`py-2 font-semibold ${v.stock_quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {v.stock_quantity.toLocaleString('ar-SY')}
                    </td>
                    <td className="py-2">
                      <span className={`text-xs ${v.is_active ? 'text-green-400' : 'text-[#9CA3AF]'}`}>
                        {v.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}