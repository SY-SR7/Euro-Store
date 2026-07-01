import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext, writeAuditLog } from '@/supabase-server';

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin } = ctx;

  const { data, error } = await admin
    .from('categories')
    .select('id, name_ar, name_en, slug, sort_order, is_active, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin, userId } = ctx;

  const body = (await req.json().catch(() => null)) as {
    name_ar?: string;
    name_en?: string;
    slug?: string;
    sort_order?: number | string;
    is_active?: boolean;
  } | null;

  const nameAr = body?.name_ar?.trim() ?? '';
  const nameEn = body?.name_en?.trim() || nameAr;
  const slug = normalizeSlug(body?.slug ?? '');

  if (!nameAr) {
    return NextResponse.json({ error: 'الاسم العربي مطلوب' }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: 'الرابط slug مطلوب ويجب أن يكون أحرفاً إنجليزية وأرقاماً وشرطات فقط' }, { status: 400 });
  }

  const sortOrder = Number(body?.sort_order ?? 0);
  const record = {
    name_ar:    nameAr,
    name_en:    nameEn,
    slug,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_active:  body?.is_active ?? true,
  };

  const { data, error } = await admin
    .from('categories')
    .insert(record as never)
    .select('id, name_ar, name_en, slug, sort_order, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await writeAuditLog({
    admin, actorId: userId, actorRole: 'admin',
    action: 'category_create', entityType: 'categories', entityId: data.id,
    afterState: record as Record<string, unknown>,
  });

  return NextResponse.json(data, { status: 201 });
}
