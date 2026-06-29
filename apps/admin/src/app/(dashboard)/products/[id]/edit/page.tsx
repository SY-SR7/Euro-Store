'use client';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createServerSupabaseClient } from '@/supabase-server';
import Link from 'next/link';
import { EditProductForm } from './EditProductForm';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

export default function EditProductPage({ params }: Props) {
  const t = useTranslations('adminCatalog');
  const supabase = createServerSupabaseClient();

  const [productRes, categoriesRes, brandsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name_ar, name_en, slug, description_ar, description_en, category_id, brand_id, is_featured, is_active')
      .eq('id', params.id)
      .single(),
    supabase.from('categories').select('id, name_ar').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
  ]);

  if (!productRes.data) notFound();

  const product    = productRes.data;
  const categories = categoriesRes.data ?? [];
  const brands     = brandsRes.data     ?? [];

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/products"
          className="text-sm text-[#9CA3AF] hover:text-[#C9A84C] transition-colors"
        >
           {t('pageTitle')}
        </Link>
        <span className="text-[#2E2E2E]">/</span>
        <span className="text-sm text-[#6B7280]">{product.name_ar}</span>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t('editProduct')}</h1>
        <div className="flex gap-3">
          <Link
            href={`/products/${params.id}/variants`}
            className="rounded-sm border border-[#2E2E2E] px-4 py-2 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#E2E2E2] transition-colors"
          >
            {t('variantsTitle')}
          </Link>
          <Link
            href={`/products/${params.id}/images`}
            className="rounded-sm border border-[#2E2E2E] px-4 py-2 text-sm text-[#9CA3AF] hover:border-[#C9A84C] hover:text-[#E2E2E2] transition-colors"
          >
            {t('imageUpload')}
          </Link>
        </div>
      </div>

      <EditProductForm product={product} categories={categories} brands={brands} />
    </div>
  );
}