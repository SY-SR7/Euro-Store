import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { fetchPublicImage, ImageImportError } from '@/lib/safe-image-import';

export const dynamic = 'force-dynamic';

const variantSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  price_override: z.number().int().nonnegative().nullable().optional(),
  stock_quantity: z.number().int().nonnegative().default(0),
  low_stock_threshold: z.number().int().nonnegative().nullable().optional(),
  attribute_value_ids: z.array(z.string().uuid()).max(30).default([]),
}).strict();

const mediaSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().url(),
  source: z.enum(['upload', 'url_import']).default('upload'),
  isPrimary: z.boolean().optional(),
  originalName: z.string().max(255).optional(),
}).strict();

const createProductSchema = z.object({
  name_ar: z.string().trim().min(1).max(300),
  name_en: z.string().trim().min(1).max(300),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description_ar: z.string().max(20_000).optional().default(''),
  description_en: z.string().max(20_000).optional().default(''),
  category_id: z.string().uuid(),
  brand_id: z.string().uuid().nullable().optional(),
  size_guide_id: z.string().uuid().nullable().optional(),
  base_price: z.number().int().nonnegative().optional(),
  base_price_syp: z.number().int().nonnegative().optional(),
  discount_percentage: z.number().positive().max(100).nullable().optional(),
  discount_start_at: z.string().datetime().nullable().optional(),
  discount_end_at: z.string().datetime().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(50).nullable().optional(),
  sku: z.string().trim().min(1).max(100).optional(),
  variants: z.array(variantSchema).min(1).max(200).optional(),
  media: z.array(mediaSchema).max(100).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.base_price === undefined && value.base_price_syp === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['base_price'], message: 'base_price_required' });
  }
  if (value.discount_start_at && value.discount_end_at && value.discount_end_at <= value.discount_start_at) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discount_end_at'], message: 'discount_period_invalid' });
  }
});

export async function GET() {
  const ctx = await requireAdminContext('product_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await ctx.admin
    .from('products')
    .select('id, name_ar, name_en, slug, base_price, discount_percentage, discount_start_at, discount_end_at, status, is_featured, is_active, created_at, category_id, brand_id, size_guide_id')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext('product_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = createProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const { admin, userId } = ctx;
  const {
    media,
    variants,
    sku,
    base_price_syp,
    is_active,
    ...input
  } = parsed.data;
  const basePrice = input.base_price ?? base_price_syp ?? 0;
  const status = input.status ?? (is_active === false ? 'draft' : 'published');

  const { data: product, error: productError } = await admin
    .from('products')
    .insert({
      name_ar: input.name_ar,
      name_en: input.name_en,
      slug: input.slug,
      description_ar: input.description_ar,
      description_en: input.description_en,
      category_id: input.category_id,
      brand_id: input.brand_id ?? null,
      size_guide_id: input.size_guide_id ?? null,
      base_price: basePrice,
      discount_percentage: input.discount_percentage ?? null,
      discount_start_at: input.discount_start_at ?? null,
      discount_end_at: input.discount_end_at ?? null,
      status,
      is_active: status === 'published',
      is_featured: input.is_featured,
      tags: input.tags ?? null,
      created_by: userId,
    })
    .select('*')
    .single();

  if (productError || !product) {
    const conflict = productError?.code === '23505';
    return NextResponse.json({ error: conflict ? 'product_exists' : 'database_error' }, { status: conflict ? 409 : 500 });
  }

  const cleanup = async () => {
    await admin.from('products').delete().eq('id', product.id);
  };
  const importedStoragePaths: string[] = [];
  const cleanupImportedFiles = async () => {
    if (importedStoragePaths.length) {
      await admin.storage.from('product-images').remove(importedStoragePaths);
    }
  };
  const requestedVariants = variants ?? [{
    sku: sku ?? input.slug,
    price_override: null,
    stock_quantity: 0,
    low_stock_threshold: null,
    attribute_value_ids: [],
  }];

  const { data: createdVariants, error: variantError } = await admin
    .from('product_variants')
    .insert(requestedVariants.map((variant) => ({
      product_id: product.id,
      sku: variant.sku,
      price_syp: variant.price_override ?? basePrice,
      price_override: variant.price_override ?? null,
      stock_quantity: variant.stock_quantity,
      low_stock_threshold: variant.low_stock_threshold ?? null,
      is_active: true,
    })))
    .select('id, sku');

  if (variantError || !createdVariants) {
    await cleanup();
    const conflict = variantError?.code === '23505';
    return NextResponse.json({ error: conflict ? 'sku_exists' : 'variant_create_failed' }, { status: conflict ? 409 : 500 });
  }

  const variantBySku = new Map(createdVariants.map((variant) => [variant.sku, variant.id]));
  const attributeRows = requestedVariants.flatMap((variant) =>
    variant.attribute_value_ids.map((attributeValueId) => ({
      variant_id: variantBySku.get(variant.sku)!,
      attribute_value_id: attributeValueId,
    })),
  );
  if (attributeRows.length) {
    const { error } = await admin.from('variant_attributes').insert(attributeRows);
    if (error) {
      await cleanup();
      return NextResponse.json({ error: 'variant_attributes_create_failed' }, { status: 500 });
    }
  }

  if (media?.length) {
    const images = media.filter((item) => item.type === 'image');
    const videos = media.filter((item) => item.type === 'video');
    if (videos.some((video) => video.source === 'url_import')) {
      await cleanup();
      return NextResponse.json({ error: 'video_url_import_not_supported' }, { status: 422 });
    }

    const resolvedImages: Array<(typeof images)[number] & { storedUrl: string }> = [];
    for (const image of images) {
      if (image.source === 'upload') {
        resolvedImages.push({ ...image, storedUrl: image.url });
        continue;
      }

      try {
        const imported = await fetchPublicImage(image.url);
        const extension = imported.contentType === 'image/jpeg' ? 'jpg' : imported.contentType.split('/')[1];
        const storagePath = `${product.id}/${crypto.randomUUID()}.${extension}`;
        const { data: uploaded, error } = await admin.storage
          .from('product-images')
          .upload(storagePath, imported.bytes, { contentType: imported.contentType, upsert: false });
        if (error || !uploaded) throw new Error('upload_failed');
        importedStoragePaths.push(uploaded.path);
        const storedUrl = admin.storage.from('product-images').getPublicUrl(uploaded.path).data.publicUrl;
        resolvedImages.push({ ...image, url: imported.sourceUrl, storedUrl });
      } catch (error) {
        await cleanupImportedFiles();
        await cleanup();
        const code = error instanceof ImageImportError ? error.code : 'url_import_failed';
        const statusCode = error instanceof ImageImportError ? error.status : 500;
        return NextResponse.json({ error: code }, { status: statusCode });
      }
    }

    const explicitPrimary = images.findIndex((image) => image.isPrimary);
    const hasPrimaryDecision = images.some((image) => image.isPrimary !== undefined);
    if (resolvedImages.length) {
      const { error } = await admin.from('product_images').insert(resolvedImages.map((image, index) => ({
        product_id: product.id,
        url: image.storedUrl,
        is_primary: explicitPrimary >= 0 ? index === explicitPrimary : hasPrimaryDecision ? false : index === 0,
        sort_order: index,
        alt_en: image.originalName ?? null,
        alt_text_en: image.originalName ?? null,
        source: image.source,
      })));
      if (error) {
        await cleanupImportedFiles();
        await cleanup();
        return NextResponse.json({ error: 'product_media_create_failed' }, { status: 500 });
      }
    }
    if (videos.length) {
      const { error } = await admin.from('product_videos').insert(videos.map((video, index) => ({
        product_id: product.id,
        url: video.url,
        thumbnail_url: video.url,
        sort_order: index,
      })));
      if (error) {
        await cleanupImportedFiles();
        await cleanup();
        return NextResponse.json({ error: 'product_media_create_failed' }, { status: 500 });
      }
    }
  }

  await writeAuditLog({
    admin,
    actorId: userId,
    actorRole: ctx.role,
    action: 'product.created',
    entityType: 'products',
    entityId: product.id,
    afterState: { ...product, variants: requestedVariants },
  });

  return NextResponse.json({ product }, { status: 201 });
}
