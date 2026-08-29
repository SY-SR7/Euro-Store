import { NextResponse } from 'next/server';
import { toJson, type TableUpdate } from '@/lib/database-types';
import { z } from 'zod';
import { homepageSectionKeySchema, parseHomepageContent } from '@/lib/homepage-contract';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

interface RouteParams { params: Promise<{ id: string }> }

const updateSchema = z.object({
  title_ar: z.string().trim().min(1).max(300).optional(),
  title_en: z.string().trim().min(1).max(300).optional(),
  content: z.unknown().optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  is_active: z.boolean().optional(),
}).strict();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('homepage_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!z.string().uuid().safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const { data, error } = await ctx.admin.from('homepage_sections').select('*').eq('id', (await params).id).maybeSingle();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('homepage_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!z.string().uuid().safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !Object.keys(parsed.data).length) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const { data: before, error: loadError } = await ctx.admin.from('homepage_sections').select('*').eq('id', (await params).id).maybeSingle();
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const sectionKey = homepageSectionKeySchema.safeParse(before.section_key);
  if (!sectionKey.success) return NextResponse.json({ error: 'invalid_section_contract' }, { status: 409 });

  const { content: requestedContent, ...fields } = parsed.data;
  const update: TableUpdate<'homepage_sections'> = fields;
  if (requestedContent !== undefined) {
    const validContent = parseHomepageContent(sectionKey.data, requestedContent);
    if (!validContent.success) return NextResponse.json({ error: 'invalid_content' }, { status: 400 });
    update.content = toJson(validContent.data);
  }

  const { data, error } = await ctx.admin.from('homepage_sections').update(update).eq('id', (await params).id).select().single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role,
    action: 'homepage_section.updated', entityType: 'homepage_sections', entityId: (await params).id,
    beforeState: before, afterState: update,
  });
  return NextResponse.json(data);
}
