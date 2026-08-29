import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';
import { collectionRpcArgs, collectionSchema } from './_schema';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminContext('collection_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [collections, products] = await Promise.all([
    ctx.admin.from('collections').select('*, collection_products(product_id, sort_order)').order('sort_order'),
    request.nextUrl.searchParams.get('options') === '1'
      ? ctx.admin.from('products').select('id, name_ar, name_en, status').neq('status', 'archived').order('name_en')
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (collections.error || products.error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ collections: collections.data ?? [], product_options: products.data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminContext('collection_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = collectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { data: id, error } = await ctx.admin.rpc('admin_save_collection', collectionRpcArgs(parsed.data, null));
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'slug_conflict' : 'database_error' }, { status: error.code === '23505' ? 409 : 500 });
  await writeAuditLog({ admin: ctx.admin, actorId: ctx.userId, actorRole: ctx.role, action: 'collection.created', entityType: 'collections', entityId: id, afterState: parsed.data });
  return NextResponse.json({ id }, { status: 201 });
}
