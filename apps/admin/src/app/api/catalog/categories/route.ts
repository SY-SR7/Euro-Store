import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { z } from 'zod';

const schema = z.object({
  name_ar:    z.string().min(1),
  name_en:    z.string().min(1),
  slug:       z.string().regex(/^[a-z0-9-]+$/),
  sort_order: z.number().int().default(0),
  is_active:  z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
    }
    const cookieStore = cookies();
    const supabase = createSupabaseServerClientFromEnv(cookieStore);
    const { data, error } = await supabase.from('categories').insert(parsed.data).select('id, slug').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);
  const { data, error } = await supabase
    .from('categories')
    .select('id, name_ar, name_en, slug, sort_order, is_active')
    .order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
