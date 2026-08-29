import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasExpectedFileSignature } from '@eurostore/shared';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

interface RouteParams { params: Promise<{ id: string }> }

const IMAGE_POLICIES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const;
const MAX_SIZE = 5 * 1024 * 1024;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('product_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!z.string().uuid().safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const { data, error } = await ctx.admin.from('product_images').select('id, url, alt_ar, alt_en, alt_text_ar, alt_text_en, source, sort_order, is_primary').eq('product_id', (await params).id).order('sort_order');
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data ?? []);
}
export async function POST(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('product_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!z.string().uuid().safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const { data: product } = await ctx.admin.from('products').select('id').eq('id', (await params).id).maybeSingle();
  if (!product) return NextResponse.json({ error: 'product_not_found' }, { status: 404 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 });
  const file = formData.get('image');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  const extension = IMAGE_POLICIES[file.type as keyof typeof IMAGE_POLICIES];
  if (!extension) return NextResponse.json({ error: 'invalid_type' }, { status: 422 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'file_too_large' }, { status: 422 });
  if (!(await hasExpectedFileSignature(file, file.type))) return NextResponse.json({ error: 'file_signature_mismatch' }, { status: 422 });

  const altAr = String(formData.get('alt_ar') ?? '').trim().slice(0, 500);
  const altEn = String(formData.get('alt_en') ?? '').trim().slice(0, 500);
  const isPrimary = formData.get('is_primary') === 'true';
  const storagePath = `${(await params).id}/${crypto.randomUUID()}.${extension}`;
  const { data: uploaded, error: uploadError } = await ctx.admin.storage.from('product-images').upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError || !uploaded) return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  const publicUrl = ctx.admin.storage.from('product-images').getPublicUrl(uploaded.path).data.publicUrl;

  const { data: image, error } = await ctx.admin.from('product_images').insert({
    product_id: (await params).id, url: publicUrl, alt_ar: altAr, alt_en: altEn,
    alt_text_ar: altAr, alt_text_en: altEn, source: 'upload', sort_order: 0, is_primary: isPrimary,
  }).select().single();
  if (error || !image) {
    await ctx.admin.storage.from('product-images').remove([uploaded.path]);
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }
  if (isPrimary) await ctx.admin.from('product_images').update({ is_primary: false }).eq('product_id', (await params).id).neq('id', image.id);

  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'product_image.created', entityType: 'product_images', entityId: image.id, afterState: image });
  return NextResponse.json({ image }, { status: 201 });
}
