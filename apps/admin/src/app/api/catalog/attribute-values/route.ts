import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.attribute_type_id || !body?.value_ar)
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('attribute_values')
    .insert({
      attribute_type_id: body.attribute_type_id,
      value_ar: body.value_ar,
      value_en: body.value_en ?? body.value_ar,
      hex_color: body.hex_color ?? null,
      sort_order: Number(body.sort_order) || 0,
    } as never)
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
