import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET() {
  const cookieStore = cookies();
  const supabase    = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data } = await admin
    .from('discount_codes')
    .select('id, code, type, value, min_order_syp, valid_until, max_uses, used_count, is_active')
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase    = createSupabaseServerClientFromEnv(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    code?: string; type?: string; value?: number;
    min_order_syp?: number; valid_until?: string; max_uses?: number;
  };

  if (!body.code?.trim() || !body.type || !body.value)
    return NextResponse.json({ error: 'code, type, value required' }, { status: 400 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('discount_codes')
    .insert({
      code         : body.code.trim().toUpperCase(),
      type         : body.type,
      value        : body.value,
      min_order_syp: body.min_order_syp ?? 0,
      valid_until  : body.valid_until ?? null,
      max_uses     : body.max_uses ?? null,
      used_count   : 0,
      is_active    : true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}