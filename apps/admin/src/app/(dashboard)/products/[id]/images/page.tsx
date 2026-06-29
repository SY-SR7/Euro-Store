// @ts-nocheck
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/supabase-server';
import Link from 'next/link';
import { ImageUploadForm } from './ImageUploadForm';

export const dynamic = 'force-dynamic';
interface Props { params: { id: string } }

export default async function ProductImagesPage({ params }: Props) {
  const supabase = createServerSupabaseClient();
  const [{ data: product }, { data: images }] = await Promise.all([
    supabase.from('products').select('id, name_ar').eq('id', params.id).single(),
    supabase.from('product_images').select('id, url, alt_ar, is_primary, sort_order')
      .eq('product_id', params.id).order('sort_order'),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-[#101010] p-6">
        <div>
          <Link href={`/products/${product.id}`}
            className="text-xs text-[#9CA3AF] hover:text-[#C9A84C] transition-colors">
            ← {product.name_ar}
          </Link>
          <h1 className="mt-1 text-2xl font-black text-white">إدارة الصور</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">{(images ?? []).length} صورة مضافة</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* Current images grid */}
        <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
          <h2 className="mb-4 text-base font-black text-[#C9A84C]">الصور الحالية</h2>
          {(!images || images.length === 0) ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-[#9CA3AF]">
              لا توجد صور بعد — ارفع أول صورة من القسم الجانبي
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map((img: any) => (
                <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#151515]">
                  <img src={img.url} alt={img.alt_ar ?? ''} className="aspect-square w-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute right-2 top-2 rounded-full bg-[#C9A84C] px-2 py-0.5 text-xs font-black text-[#111]">
                      رئيسية
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload form */}
        <div className="rounded-3xl border border-white/10 bg-[#101010] p-6">
          <h2 className="mb-4 text-base font-black text-[#C9A84C]">رفع صورة جديدة</h2>
          <ImageUploadForm productId={product.id} />
        </div>
      </div>
    </div>
  );
}