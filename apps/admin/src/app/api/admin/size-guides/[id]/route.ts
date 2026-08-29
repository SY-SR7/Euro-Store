import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { sizeGuideSchema } from '@/lib/size-guide-schema';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('product_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await ctx.admin.from('size_guides').select('*').eq('id', (await params).id).maybeSingle();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ size_guide: data });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('product_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = sizeGuideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { data: before } = await ctx.admin.from('size_guides').select('*').eq('id', (await params).id).maybeSingle();
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { data, error } = await ctx.admin.from('size_guides').update(parsed.data).eq('id', (await params).id).select('*').single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'size_guide.updated', entityType: 'size_guides', entityId: (await params).id, beforeState: before, afterState: data });
  return NextResponse.json({ size_guide: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('product_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: before } = await ctx.admin.from('size_guides').select('*').eq('id', (await params).id).maybeSingle();
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { error } = await ctx.admin.from('size_guides').delete().eq('id', (await params).id);
  if (error) return NextResponse.json({ error: 'size_guide_in_use' }, { status: 409 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'size_guide.deleted', entityType: 'size_guides', entityId: (await params).id, beforeState: before });
  return NextResponse.json({ success: true });
}
