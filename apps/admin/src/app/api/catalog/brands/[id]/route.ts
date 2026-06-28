import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { z } from 'zod';

const updateSchema = z.object({
  name:      z.string().min(1).optional(),
  slug:      z.string().regex(/^[a-z0-9-]+$/).optional(),
  is_active: z.boolean().optional(),
});

interface RouteParams { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body: unknown = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const cookieStore = cookies();
    const supabase = createSupabaseServerClientFromEnv(cookieStore);
    const { data, error } = await supabase
      .from('brands').update(parsed.data).eq('id', params.id).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClientFromEnv(cookieStore);
    const { error } = await supabase.from('brands').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}