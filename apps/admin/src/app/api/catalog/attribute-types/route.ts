import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('attribute_types')
    .select('id, name_ar, name_en, slug, attribute_values(id, value_ar, value_en, hex_color, sort_order)')
    .order('created_at');
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.name_ar !== 'string' || typeof body.slug !== 'string') {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const nameAr = body.name_ar.trim();
  const nameEn = typeof body.name_en === 'string' && body.name_en.trim() ? body.name_en.trim() : nameAr;
  const slug = body.slug.trim();
  if (!nameAr || !slug) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  const { data, error } = await ctx.admin
    .from('attribute_types')
    .insert({ name_ar: nameAr, name_en: nameEn, slug } as never)
    .select('id, name_ar, name_en, slug, attribute_values(id, value_ar, value_en, hex_color, sort_order)')
    .single();

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
