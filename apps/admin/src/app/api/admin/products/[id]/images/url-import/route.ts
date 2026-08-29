import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { fetchPublicImage, ImageImportError } from '@/lib/safe-image-import';

export const dynamic = 'force-dynamic';

const schema = z.object({
  url: z.string().url(),
  alt_ar: z.string().optional(),
  alt_en: z.string().optional(),
  is_primary: z.boolean().optional(),
});

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('product_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  let imported;
  try {
    imported = await fetchPublicImage(parsed.data.url);
  } catch (error) {
    if (error instanceof ImageImportError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'url_fetch_failed' }, { status: 422 });
  }

  const { bytes, contentType, sourceUrl } = imported;
  const ext = EXT_BY_TYPE[contentType];
  const storagePath = `${(await params).id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { data: uploaded, error: uploadError } = await ctx.admin.storage
    .from('product-images')
    .upload(storagePath, bytes, { contentType, upsert: false });

  if (uploadError || !uploaded) {
    return NextResponse.json({ error: uploadError?.message ?? 'upload_failed' }, { status: 500 });
  }

  const { data: { publicUrl } } = ctx.admin.storage.from('product-images').getPublicUrl(uploaded.path);
  if (parsed.data.is_primary) {
    await ctx.admin.from('product_images').update({ is_primary: false }).eq('product_id', (await params).id);
  }

  const { data, error } = await ctx.admin
    .from('product_images')
    .insert({
      product_id: (await params).id,
      url: publicUrl,
      alt_ar: parsed.data.alt_ar ?? '',
      alt_en: parsed.data.alt_en ?? '',
      alt_text_ar: parsed.data.alt_ar ?? '',
      alt_text_en: parsed.data.alt_en ?? '',
      source: 'url_import',
      is_primary: parsed.data.is_primary ?? false,
      sort_order: 0,
    })
    .select()
    .single();

  if (error) {
    await ctx.admin.storage.from('product-images').remove([uploaded.path]);
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'product_image.url_imported',
    entityType: 'product_images',
    entityId: data.id,
    afterState: { source_url: sourceUrl, public_url: publicUrl },
  });

  return NextResponse.json({ image: data }, { status: 201 });
}
