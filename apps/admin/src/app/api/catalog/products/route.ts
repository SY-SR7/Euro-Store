import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext, writeAuditLog } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createProductSchema = z.object({
  name_ar:        z.string().min(1),
  name_en:        z.string().min(1),
  slug:           z.string().regex(/^[a-z0-9-]+$/),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  category_id:    z.string().uuid().optional(),
  brand_id:       z.string().uuid().optional(),
  is_featured:    z.boolean().default(false),
  is_active:      z.boolean().default(true),
  base_price_syp: z.number().nonnegative(),
  sku:            z.string().optional(),
  media:          z.array(z.object({
    type: z.enum(['image', 'video']),
    url: z.string().url(),
    isPrimary: z.boolean().optional(),
    originalName: z.string().optional()
  })).optional(),
});

export async function GET() {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('id, name_ar, name_en, slug, is_featured, is_active, created_at, category_id, brand_id')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin, userId } = ctx;

  try {
    const body: unknown = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { media, base_price_syp, sku, ...productData } = parsed.data;

    // Find primary image URL
    const primaryImage = media?.find(m => m.type === 'image' && m.isPrimary)?.url 
                      || media?.find(m => m.type === 'image')?.url;

    if (primaryImage) {
      (productData as any).image_url = primaryImage;
    }

    const { data, error } = await admin
      .from('products')
      .insert(productData as never)
      .select('id, name_ar, name_en, slug')
      .single();
    if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

    // Create the default variant so the product shows up on the frontend
    const { error: variantError } = await admin
      .from('product_variants')
      .insert({
        product_id: data.id,
        price_syp: base_price_syp,
        sku: sku || data.slug,
        is_active: true,
      } as never);
    if (variantError) console.error('Failed to create default variant:', variantError);

    if (media && media.length > 0) {
      const images = media.filter(m => m.type === 'image').map((m, index) => ({
        product_id: data.id,
        url: m.url,
        is_primary: m.isPrimary || false,
        sort_order: index,
        alt_en: m.originalName
      }));
      if (images.length) await admin.from('product_images').insert(images as never);

      const videos = media.filter(m => m.type === 'video').map((m) => ({
        product_id: data.id,
        url: m.url,
        thumbnail_url: m.url // Fallback
      }));
      if (videos.length) await admin.from('product_videos').insert(videos as never);
    }

    await writeAuditLog({
      admin, actorId: userId, actorRole: 'admin',
      action: 'product_create', entityType: 'products', entityId: data.id,
      afterState: parsed.data as Record<string, unknown>,
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
