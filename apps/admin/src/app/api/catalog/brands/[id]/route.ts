import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

interface RouteParams { params: { id: string } }

export async function GET(_req: Request, { params }: RouteParams) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('brands').select('*').eq('id', params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const update: Record<string, unknown> = {};
  if (typeof body.name === 'string') update.name = body.name.trim();
  if (typeof body.slug === 'string') update.slug = body.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
  if (typeof body.logo_url === 'string') update.logo_url = body.logo_url || null;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  const { data, error } = await admin.from('brands').update(update as never).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;
  const { error } = await admin.from('brands').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}