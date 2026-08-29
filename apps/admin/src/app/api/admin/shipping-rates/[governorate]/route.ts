import { NextResponse } from 'next/server';
import type { TableUpdate } from '@/lib/database-types';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ governorate: string }> }) {
  const ctx = await requireAdminContext('shipping_configuration', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const governorate = decodeURIComponent((await params).governorate);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const update: TableUpdate<'shipping_rates'> = {};
  if (typeof body.base_rate_syp === 'number') update.base_rate_syp = body.base_rate_syp;
  if (typeof body.free_shipping_threshold_syp === 'number' || body.free_shipping_threshold_syp === null) {
    update.free_shipping_threshold_syp = body.free_shipping_threshold_syp;
  }
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;

  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

  const { data: before } = await ctx.admin
    .from('shipping_rates')
    .select('*')
    .eq('governorate', governorate)
    .maybeSingle();

  const { data, error } = await ctx.admin
    .from('shipping_rates')
    .update(update)
    .eq('governorate', governorate)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });

  await writeAuditLog({
    admin: ctx.admin,
    actorId: ctx.userId,
    actorRole: ctx.role,
    action: 'shipping_rate.updated',
    entityType: 'shipping_rates',
    entityId: data.id,
    beforeState: before,
    afterState: update,
  });

  return NextResponse.json(data);
}
