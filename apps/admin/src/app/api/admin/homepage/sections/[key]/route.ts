import { NextResponse } from 'next/server';
import { toJson, type TableUpdate } from '@/lib/database-types';
import { z } from 'zod';
import { homepageSectionKeySchema, parseHomepageContent } from '@/lib/homepage-contract';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title_ar: z.string().trim().min(1).max(300).optional(),
  title_en: z.string().trim().min(1).max(300).optional(),
  content: z.unknown().optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  is_active: z.boolean().optional(),
}).strict();

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const ctx = await requireAdminContext('homepage_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sectionKey = homepageSectionKeySchema.safeParse(decodeURIComponent((await params).key));
  if (!sectionKey.success) return NextResponse.json({ error: 'invalid_section_key' }, { status: 400 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !Object.keys(parsed.data).length) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { content: requestedContent, ...fields } = parsed.data;
  const update: TableUpdate<'homepage_sections'> = fields;
  if (requestedContent !== undefined) {
    const content = parseHomepageContent(sectionKey.data, requestedContent);
    if (!content.success) return NextResponse.json({ error: 'invalid_content' }, { status: 400 });
    update.content = toJson(content.data);
  }

  const { data: before, error: loadError } = await ctx.admin.from('homepage_sections').select('*').eq('section_key', sectionKey.data).maybeSingle();
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { data, error } = await ctx.admin.from('homepage_sections').update(update).eq('id', before.id).select().single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role,
    action: 'homepage_section.updated', entityType: 'homepage_sections', entityId: before.id,
    beforeState: before, afterState: update,
  });
  return NextResponse.json({ section: data });
}
