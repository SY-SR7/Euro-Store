import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const updateSchema = z.object({
  name_ar:    z.string().min(1).optional(),
  name_en:    z.string().min(1).optional(),
  slug:       z.string().regex(/^[a-z0-9-]+$/).optional(),
  sort_order: z.number().int().optional(),
  is_active:  z.boolean().optional(),
});

interface RouteParams { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body: unknown = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories').update(parsed.data).eq('id', params.id).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('categories').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}