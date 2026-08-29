import { requireAdminContext } from '@/supabase-server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const createSchema = z.object({
  attribute_type_id: z.string().uuid(),
  value_ar: z.string().trim().min(1).max(200),
  value_en: z.string().trim().max(200).optional(),
  hex_color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
}).strict();

export async function POST(request: Request) {
  const ctx = await requireAdminContext('product_management', 'create');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('attribute_values')
    .insert({
      attribute_type_id: parsed.data.attribute_type_id,
      value_ar: parsed.data.value_ar,
      value_en: parsed.data.value_en ?? parsed.data.value_ar,
      hex_color: parsed.data.hex_color ?? null,
      sort_order: parsed.data.sort_order ?? 0,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
