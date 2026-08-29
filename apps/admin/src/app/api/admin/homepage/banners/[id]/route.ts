import { NextResponse } from 'next/server';
import { z } from 'zod';
import { homepageBannerSchema, isTrustedHomepageMediaUrl } from '@/lib/homepage-contract';
import { toJson } from '@/lib/database-types';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title_ar: z.string().trim().max(300).optional(),
  title_en: z.string().trim().max(300).optional(),
  subtitle_ar: z.string().trim().max(1000).optional(),
  subtitle_en: z.string().trim().max(1000).optional(),
  image_url: z.string().url().optional(),
  mobile_image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  cta_url: z.string().trim().regex(/^\/(?!\/)/).optional(),
  cta_label_ar: z.string().trim().max(100).optional(),
  cta_label_en: z.string().trim().max(100).optional(),
  is_active: z.boolean().optional(),
}).strict();

function contentRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function loadSection(ctx: NonNullable<Awaited<ReturnType<typeof requireAdminContext>>>) {
  return ctx.admin.from('homepage_sections').select('*').eq('section_key', 'main_banner').maybeSingle();
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('homepage_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !Object.keys(parsed.data).length) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  if (parsed.data.cta_url && !/^\/(?!\/)/.test(parsed.data.cta_url)) return NextResponse.json({ error: 'invalid_cta_url' }, { status: 400 });
  for (const mediaUrl of [parsed.data.image_url, parsed.data.mobile_image_url, parsed.data.video_url].filter(Boolean) as string[]) {
    if (!isTrustedHomepageMediaUrl(mediaUrl)) return NextResponse.json({ error: 'media_must_be_uploaded' }, { status: 422 });
  }

  const { data: section, error: loadError } = await loadSection(ctx);
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!section) return NextResponse.json({ error: 'section_not_found' }, { status: 404 });
  const content = contentRecord(section.content);
  const banners = Array.isArray(content.banners) ? content.banners as Array<Record<string, unknown>> : [];
  const index = banners.findIndex((banner) => banner.id === id);
  if (index < 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const candidate = { ...banners[index], ...parsed.data };
  if (parsed.data.image_url) delete candidate.video_url;
  if (parsed.data.video_url) delete candidate.image_url;
  const validated = homepageBannerSchema.safeParse(candidate);
  if (!validated.success) return NextResponse.json({ error: 'invalid_banner' }, { status: 400 });
  const nextBanners = [...banners];
  nextBanners[index] = validated.data;
  const { error } = await ctx.admin.from('homepage_sections').update({ content: toJson({ banners: nextBanners }) }).eq('id', section.id);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role,
    action: 'homepage_banner.updated', entityType: 'homepage_sections', entityId: section.id,
    beforeState: banners[index], afterState: validated.data,
  });
  return NextResponse.json({ banner: validated.data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('homepage_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const { data: section, error: loadError } = await loadSection(ctx);
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!section) return NextResponse.json({ error: 'section_not_found' }, { status: 404 });
  const content = contentRecord(section.content);
  const banners = Array.isArray(content.banners) ? content.banners as Array<Record<string, unknown>> : [];
  const removed = banners.find((banner) => banner.id === id);
  if (!removed) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const nextBanners = banners.filter((banner) => banner.id !== id).map((banner, index) => ({ ...banner, sort_order: index }));
  const { error } = await ctx.admin.from('homepage_sections').update({ content: toJson({ banners: nextBanners }) }).eq('id', section.id);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role,
    action: 'homepage_banner.deleted', entityType: 'homepage_sections', entityId: section.id,
    beforeState: removed,
  });
  return NextResponse.json({ deleted: true });
}
