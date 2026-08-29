import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('product_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  let isActive: boolean | null = null;
  let status: 'draft' | 'published' | 'archived' | null = null;
  if (typeof body.is_active === 'boolean') isActive = body.is_active;
  if (typeof body.status === 'string') {
    if (['published', 'active'].includes(body.status)) { isActive = true; status = 'published'; }
    if (body.status === 'draft') { isActive = false; status = 'draft'; }
    if (['archived', 'inactive'].includes(body.status)) { isActive = false; status = 'archived'; }
  }

  if (isActive === null) return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  status ??= isActive ? 'published' : 'archived';

  const { data: before } = await ctx.admin
    .from('products')
    .select('id, status, is_active')
    .eq('id', (await params).id)
    .single();

  const { data, error } = await ctx.admin
    .from('products')
    .update({ status, is_active: isActive })
    .eq('id', (await params).id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: `product.${status}`,
    entityType: 'products',
    entityId: (await params).id,
    beforeState: before,
    afterState: { status, is_active: isActive },
  });

  return NextResponse.json({ product: data });
}
