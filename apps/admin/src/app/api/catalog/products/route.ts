import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { z } from 'zod';

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

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createSupabaseServerClientFromEnv(cookieStore);

    const { data, error } = await supabase
      .from('products')
      .insert(parsed.data)
      .select('id, slug')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);

  const { data, error } = await supabase
    .from('products')
    .select('id, name_ar, name_en, slug, is_featured, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
