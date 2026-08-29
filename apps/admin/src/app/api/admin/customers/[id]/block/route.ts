import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('customer_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const { data: before, error: beforeError } = await ctx.admin
    .from('customer_profiles')
    .select('id, is_blocked')
    .eq('id', (await params).id)
    .single();

  if (beforeError) return NextResponse.json({ error: beforeError.message }, { status: 404 });

  const nextBlocked =
    typeof body.is_blocked === 'boolean'
      ? body.is_blocked
      : typeof body.blocked === 'boolean'
        ? body.blocked
        : !before.is_blocked;

  const { data, error } = await ctx.admin
    .from('customer_profiles')
    .update({ is_blocked: nextBlocked })
    .eq('id', (await params).id)
    .select('id, full_name, email, is_blocked')
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: nextBlocked ? 'customer.blocked' : 'customer.unblocked',
    entityType: 'customer_profiles',
    entityId: (await params).id,
    beforeState: before,
    afterState: { is_blocked: nextBlocked },
  });

  return NextResponse.json({ customer: data });
}
