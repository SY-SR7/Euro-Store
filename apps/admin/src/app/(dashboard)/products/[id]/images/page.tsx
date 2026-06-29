import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/supabase-server';
import Link from 'next/link';
import { ImageUploadForm } from './ImageUploadForm';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

export default async function ProductImagesPage({ params }: Props) {
  const t = await getTranslations('adminCatalog');
  const supabase = createServerSupabaseClient();

  const [productRes, imagesRes] = await Promise.all([
    supabase.from('products').select('id, name_ar').eq('id', params.id).single(),
    supabase
      .from('product_images')
      .select('id, url, alt_ar, is_primary, sort_order')
      .eq('product_id', params.id)
      .order('sort_order'),
  ]);

  if (!productRes.data) notFound();

  const product = productRes.data;
  const images  = imagesRes.data ?? [];

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/products/${product.id}/edit`}
          className="text-sm text-[#9CA3AF] hover:text-[#C9A84C] transition-colors">
           {product.name_ar}
        </Link>
      </div>
      <h1 className="mb-8 text-3xl font-semibold">{t('imageUpload')}</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* Current images */}
        <div>
          {images.length === 0 ? (
            <div className="rounded-md border border-[#2E2E2E] bg-[#151515] p-8 text-center text-[#9CA3AF]">
              لا توجد صور بعد
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map(img => (
                <div key={img.id} className="relative rounded-md border border-[#2E2E2E] bg-[#151515] overflow-hidden">
                  <img src={img.url} alt={img.alt_ar ?? ''} className="aspect-square w-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute top-2 start-2 rounded-sm bg-[#C9A84C] px-2 py-0.5 text-xs font-semibold text-[#111]">
                      رئيسية
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload form */}
        <div>
          <h2 className="mb-6 text-xl font-semibold">رفع صورة جديدة</h2>
          <ImageUploadForm productId={product.id} />
        </div>
      </div>
    </div>
  );
}