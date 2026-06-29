import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClientFromEnv();
  const { data } = await admin
    .from('discount_codes')
    .select('id, code, type, value, min_order_syp, valid_from, valid_until, max_uses, used_count, is_active, created_at')
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    code?: string; type?: string; value?: number;
    min_order_syp?: number; valid_from?: string; valid_until?: string | null; max_uses?: number | null;
  };

  if (!body.code?.trim() || !body.type || body.value === undefined)
    return NextResponse.json({ error: 'code, type, value required' }, { status: 400 });

  const today = new Date().toISOString().split('T')[0]!;

  const admin = createSupabaseAdminClientFromEnv();
  const { data, error } = await admin
    .from('discount_codes')
    .insert({
      code         : body.code.trim().toUpperCase(),
      type         : body.type as 'percentage' | 'fixed',
      value        : body.value,
      min_order_syp: body.min_order_syp ?? 0,
      valid_from   : body.valid_from ?? today,
      valid_until  : body.valid_until ?? null,
      max_uses     : body.max_uses    ?? null,
    } as never)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}