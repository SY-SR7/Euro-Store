import { NextResponse } from 'next/server';
import type { TableUpdate } from '@/lib/database-types';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

interface RouteParams { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('category_management', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('categories').select('*').eq('id', (await params).id).single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('category_management', 'edit');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const update: TableUpdate<'categories'> = {};
  if (typeof body.name_ar === 'string') update.name_ar = body.name_ar.trim();
  if (typeof body.name_en === 'string') update.name_en = body.name_en.trim();
  if (typeof body.slug === 'string') update.slug = body.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
  if (typeof body.sort_order === 'number') update.sort_order = body.sort_order;
  if (typeof body.image_url === 'string') update.image_url = body.image_url || null;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

  const { data, error } = await admin.from('categories').update(update).eq('id', (await params).id).select().single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext('category_management', 'delete');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
const { admin } = ctx;
  const { error } = await admin.from('categories').delete().eq('id', (await params).id);
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
