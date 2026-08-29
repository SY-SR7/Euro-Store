import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { homepageBannerSchema, isTrustedHomepageMediaUrl } from '@/lib/homepage-contract';

export const dynamic = 'force-dynamic';

const schema = z.object({
  title_ar: z.string().optional().default(''),
  title_en: z.string().optional().default(''),
  subtitle_ar: z.string().optional().default(''),
  subtitle_en: z.string().optional().default(''),
  image_url: z.string().url().optional(),
  mobile_image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  cta_url: z.string().regex(/^\/(?!\/)/).optional().default('/products'),
  cta_label_ar: z.string().optional().default('تسوقي الآن'),
  cta_label_en: z.string().optional().default('Shop now'),
  is_active: z.boolean().optional().default(true),
}).strict();

type Banner = z.infer<typeof schema> & { id: string; sort_order: number; created_at: string };

function contentRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getBanners(content: Record<string, unknown>): Banner[] {
  const value = Array.isArray(content.banners) ? content.banners : Array.isArray(content.slides) ? content.slides : [];
  return value.filter((item): item is Banner => Boolean(item) && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string');
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext('homepage_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  if (!parsed.data.image_url && !parsed.data.video_url) {
    return NextResponse.json({ error: 'media_required' }, { status: 400 });
  }
  if (parsed.data.image_url && parsed.data.video_url) return NextResponse.json({ error: 'one_media_type_only' }, { status: 400 });
  const mediaUrl = parsed.data.image_url ?? parsed.data.video_url!;
  if (!isTrustedHomepageMediaUrl(mediaUrl)) return NextResponse.json({ error: 'media_must_be_uploaded' }, { status: 422 });
  if (parsed.data.mobile_image_url && !isTrustedHomepageMediaUrl(parsed.data.mobile_image_url)) return NextResponse.json({ error: 'mobile_media_must_be_uploaded' }, { status: 422 });

  const { data: existing } = await ctx.admin
    .from('homepage_sections')
    .select('*')
    .in('section_key', ['main_banner', 'hero'])
    .order('section_key', { ascending: true })
    .limit(1)
    .maybeSingle();

  const content = contentRecord(existing?.content);
  const banners = getBanners(content);
  const banner: Banner = {
    ...parsed.data,
    id: crypto.randomUUID(),
    sort_order: banners.length,
    created_at: new Date().toISOString(),
  };
  const validBanner = homepageBannerSchema.safeParse(banner);
  if (!validBanner.success) return NextResponse.json({ error: 'invalid_banner' }, { status: 400 });

  const nextContent = { banners: [...banners, validBanner.data] };

  const write = existing
    ? ctx.admin
        .from('homepage_sections')
        .update({ content: nextContent })
        .eq('id', existing.id)
        .select()
        .single()
    : ctx.admin
        .from('homepage_sections')
        .insert({
          section_key: 'main_banner',
          title_ar: 'البنر الرئيسي',
          title_en: 'Main banner',
          content: nextContent,
          is_active: true,
          sort_order: 0,
        })
        .select()
        .single();

  const { data, error } = await write;
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'homepage_banner.created',
    entityType: 'homepage_sections',
    entityId: data.id,
    afterState: banner,
  });

  return NextResponse.json({ banner, section: data }, { status: 201 });
}
