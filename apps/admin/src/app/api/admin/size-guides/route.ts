import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { sizeGuideSchema } from '@/lib/size-guide-schema';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export async function GET() {
  const ctx = await requireAdminContext('product_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await ctx.admin.from('size_guides').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ size_guides: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminContext('product_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = sizeGuideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { data, error } = await ctx.admin.from('size_guides').insert(parsed.data).select('*').single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'size_guide.created', entityType: 'size_guides', entityId: data.id, afterState: data });
  return NextResponse.json({ size_guide: data }, { status: 201 });
}
