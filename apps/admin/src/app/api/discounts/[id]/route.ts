import { NextResponse } from 'next/server';
import type { TableUpdate } from '@/lib/database-types';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

interface RouteParams { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('discount_code_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('discount_codes').select('*').eq('id', (await params).id).single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('discount_code_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const update: TableUpdate<'discount_codes'> = {};
  if (typeof body.code === 'string') update.code = body.code.trim().toUpperCase();
  if (typeof body.description === 'string' || body.description === null) update.description = body.description;
  if (body.type === 'percentage' || body.type === 'fixed' || body.type === 'fixed_amount') update.type = body.type;
  if (typeof body.value === 'number') update.value = body.value;
  if (body.eligibility === 'all_users' || body.eligibility === 'first_time_buyers') update.eligibility = body.eligibility;
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
  const minOrderSyp = body.min_order_syp !== undefined ? body.min_order_syp : body.min_cart_value;
  if (typeof minOrderSyp === 'number' || minOrderSyp === null) update.min_order_syp = minOrderSyp;
  if (body.scope === 'entire_store' || body.scope === 'categories' || body.scope === 'products') update.scope = body.scope;
  if (Array.isArray(body.category_ids) || body.category_ids === null) update.category_ids = body.category_ids;
  if (Array.isArray(body.product_ids) || body.product_ids === null) update.product_ids = body.product_ids;
  const maxUses = body.max_uses !== undefined ? body.max_uses : body.max_uses_total;
  if (typeof maxUses === 'number' || maxUses === null) update.max_uses = maxUses;
  if (typeof body.max_uses_per_user === 'number' || body.max_uses_per_user === null) update.max_uses_per_user = body.max_uses_per_user;
  if (typeof body.valid_from === 'string') update.valid_from = body.valid_from;
  if (typeof body.valid_until === 'string') update.valid_until = body.valid_until;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  update.updated_at = new Date().toISOString();
  const { data, error } = await admin.from('discount_codes').update(update).eq('id', (await params).id).select().single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('discount_code_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;
  const { error } = await admin.from('discount_codes').delete().eq('id', (await params).id);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
