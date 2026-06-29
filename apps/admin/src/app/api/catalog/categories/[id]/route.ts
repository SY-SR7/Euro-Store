import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

interface RouteParams {
  params: { id: string };
}

async function requireAdminUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const update: Record<string, unknown> = {};

  if (typeof body.name_ar === 'string') update.name_ar = body.name_ar.trim();
  if (typeof body.name_en === 'string') update.name_en = body.name_en.trim();
  if (typeof body.slug === 'string') update.slug = normalizeSlug(body.slug);
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;

  if (body.sort_order !== undefined) {
    const n = Number(body.sort_order);
    if (Number.isFinite(n)) update.sort_order = n;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = createSupabaseAdminClientFromEnv();

  const { data, error } = await admin
    .from('categories')
    .update(update as never)
    .eq('id', params.id)
    .select('id, name_ar, name_en, slug, sort_order, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();

  const { error } = await admin
    .from('categories')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}