import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext, writeAuditLog } from '@/supabase-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createProductSchema = z.object({
  name_ar:        z.string().min(1),
  name_en:        z.string().min(1),
  slug:           z.string().regex(/^[a-z0-9-]+$/),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  category_id:    z.string().uuid().optional(),
  brand_id:       z.string().uuid().optional(),
  is_featured:    z.boolean().default(false),
  is_active:      z.boolean().default(true),
});

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('id, name_ar, name_en, slug, is_featured, is_active, created_at, category_id, brand_id')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin, userId } = ctx;

  try {
    const body: unknown = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await admin
      .from('products')
      .insert(parsed.data as never)
      .select('id, name_ar, name_en, slug')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog({
      admin, actorId: userId, actorRole: 'admin',
      action: 'product_create', entityType: 'products', entityId: data.id,
      afterState: parsed.data as Record<string, unknown>,
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
