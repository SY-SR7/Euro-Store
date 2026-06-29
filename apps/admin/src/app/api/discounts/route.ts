import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('discount_codes')
      .select('id,code,type,value,min_order_syp,valid_from,valid_until,max_uses,used_count,is_active,created_at')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient();
    const body = await req.json() as {
      code?: string; type?: string; value?: number;
      min_order_syp?: number; valid_from?: string; valid_until?: string|null; max_uses?: number|null;
    };
    if (!body.code?.trim() || !body.type || body.value === undefined)
      return NextResponse.json({ error: 'code, type, value required' }, { status: 400 });

    const today = new Date().toISOString().slice(0, 10);
    const record = {
      code: body.code.trim().toUpperCase(),
      type: body.type,
      value: body.value,
      min_order_syp: body.min_order_syp ?? 0,
      valid_from: body.valid_from ?? today,
      valid_until: body.valid_until ?? null,
      max_uses: body.max_uses ?? null,
      used_count: 0,
      is_active: true,
    };
    const { data, error } = await admin.from('discount_codes').insert(record as never).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}