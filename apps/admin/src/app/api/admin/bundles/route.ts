import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { bundleRpcArgs, bundleSchema } from './_schema';

async function variantOptions(admin: NonNullable<Awaited<ReturnType<typeof requireAdminContext>>>['admin']) {
  return admin.from('product_variants').select('id, sku, stock_quantity, products(name_ar, name_en, status)').order('sku');
}

export async function GET(request: NextRequest) {
  const ctx = await requireAdminContext('bundle_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const [bundles, variants] = await Promise.all([
    ctx.admin.from('product_bundles').select('*, bundle_items(id, product_variant_id, quantity)').order('created_at', { ascending: false }),
    request.nextUrl.searchParams.get('options') === '1' ? variantOptions(ctx.admin) : Promise.resolve({ data: null, error: null }),
  ]);
  if (bundles.error || variants.error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ bundles: bundles.data ?? [], variant_options: variants.data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminContext('bundle_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = bundleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { data: id, error } = await ctx.admin.rpc('admin_save_product_bundle', bundleRpcArgs(parsed.data, null));
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'slug_conflict' : 'database_error' }, { status: error.code === '23505' ? 409 : 500 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'bundle.created', entityType: 'product_bundles', entityId: id, afterState: parsed.data });
  return NextResponse.json({ id }, { status: 201 });
}
