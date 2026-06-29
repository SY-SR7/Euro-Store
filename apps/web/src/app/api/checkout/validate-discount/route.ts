/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { code?: string; subtotal?: number };
    const code = (body.code ?? '').trim().toUpperCase();
    const subtotal = body.subtotal ?? 0;
    if (!code) return NextResponse.json({ error: 'no_code' }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('discount_codes')
      .select('id,code,type,value,min_order_syp,max_uses,used_count,valid_from,valid_until,is_active')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) return NextResponse.json({ error: 'invalid_code' }, { status: 404 });

    if (data.valid_from && now < data.valid_from) return NextResponse.json({ error: 'not_started' }, { status: 400 });
    if (data.valid_until && now > data.valid_until) return NextResponse.json({ error: 'expired' }, { status: 400 });
    if (data.max_uses && data.used_count >= data.max_uses) return NextResponse.json({ error: 'exhausted' }, { status: 400 });
    if (data.min_order_syp && subtotal < data.min_order_syp) return NextResponse.json({ error: 'min_order', min: data.min_order_syp }, { status: 400 });

    const discount_amount = data.type === 'percentage'
      ? Math.round(subtotal * (data.value / 100))
      : Number(data.value);

    return NextResponse.json({ discount_id: data.id, discount_amount: Math.min(discount_amount, subtotal), type: data.type, value: data.value });
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}