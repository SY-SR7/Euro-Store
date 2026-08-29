import { NextResponse } from 'next/server';
import { z } from 'zod';
import { toJson } from '@/lib/database-types';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

type Banner = Record<string, unknown> & { id: string; sort_order?: number };

function contentRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function PUT(request: Request) {
  const ctx = await requireAdminContext('homepage_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { data: section, error: sectionError } = await ctx.admin
    .from('homepage_sections')
    .select('*')
    .in('section_key', ['main_banner', 'hero'])
    .order('section_key', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (sectionError || !section) return NextResponse.json({ error: sectionError?.message ?? 'section_not_found' }, { status: 404 });

  const content = contentRecord(section.content);
  const banners = (Array.isArray(content.banners) ? content.banners : []) as Banner[];
  const byId = new Map(banners.filter((banner) => typeof banner.id === 'string').map((banner) => [banner.id, banner]));
  const ordered = parsed.data.ids
    .map((id, index) => {
      const banner = byId.get(id);
      return banner ? { ...banner, sort_order: index } : null;
    })
    .filter(Boolean) as Banner[];

  const remaining = banners
    .filter((banner) => !parsed.data.ids.includes(banner.id))
    .map((banner, index) => ({ ...banner, sort_order: ordered.length + index }));

  const nextContent = { ...content, banners: [...ordered, ...remaining] };
  const { data, error } = await ctx.admin
    .from('homepage_sections')
    .update({ content: toJson(nextContent) })
    .eq('id', section.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'homepage_banner.reordered',
    entityType: 'homepage_sections',
    entityId: section.id,
    beforeState: { banners },
    afterState: { ids: parsed.data.ids },
  });

  return NextResponse.json({ section: data });
}
