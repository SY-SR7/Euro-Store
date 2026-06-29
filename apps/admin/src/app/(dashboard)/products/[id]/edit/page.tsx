// @ts-nocheck
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/supabase-server';
import { EditProductForm } from './EditProductForm';

export const dynamic = 'force-dynamic';
interface Props { params: { id: string } }

export default async function EditProductPage({ params }: Props) {
  const supabase = createServerSupabaseClient();
  const [{ data: product }, { data: categories }, { data: brands }] = await Promise.all([
    supabase.from('products').select('id,name_ar,name_en,slug,description_ar,description_en,is_featured,is_active,category_id,brand_id').eq('id', params.id).single(),
    supabase.from('categories').select('id,name_ar,name_en').eq('is_active', true).order('name_ar'),
    supabase.from('brands').select('id,name').eq('is_active', true).order('name'),
  ]);
  if (!product) notFound();
  return <EditProductForm product={product as any} categories={categories ?? []} brands={brands ?? []} />;
}