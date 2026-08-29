import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { bundleRpcArgs, bundleSchema } from '../_schema';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('bundle_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const [bundle, variants] = await Promise.all([
    ctx.admin.from('product_bundles').select('*, bundle_items(id, product_variant_id, quantity)').eq('id', (await params).id).maybeSingle(),
    ctx.admin.from('product_variants').select('id, sku, stock_quantity, products(name_ar, name_en, status)').order('sku'),
  ]);
  if (bundle.error || variants.error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!bundle.data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ bundle: bundle.data, variant_options: variants.data ?? [] });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('bundle_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = bundleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { data: before } = await ctx.admin.from('product_bundles').select('*, bundle_items(*)').eq('id', (await params).id).maybeSingle();
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { error } = await ctx.admin.rpc('admin_save_product_bundle', bundleRpcArgs(parsed.data, (await params).id));
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'slug_conflict' : 'database_error' }, { status: error.code === '23505' ? 409 : 500 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'bundle.updated', entityType: 'product_bundles', entityId: (await params).id, beforeState: before, afterState: parsed.data });
  return NextResponse.json({ id: (await params).id });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext('bundle_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: before } = await ctx.admin.from('product_bundles').select('*, bundle_items(*)').eq('id', (await params).id).maybeSingle();
  if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { error } = await ctx.admin.from('product_bundles').delete().eq('id', (await params).id);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'bundle.deleted', entityType: 'product_bundles', entityId: (await params).id, beforeState: before });
  return NextResponse.json({ success: true });
}
