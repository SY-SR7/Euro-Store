/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const schema = z.object({
  code:         z.string().min(1),
  subtotal_syp: z.number().positive(),
});

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const { code, subtotal_syp } = parsed.data;

  // Ø£Ø¹Ù…Ø¯Ø© discount_codes Ø§Ù„ØµØ­ÙŠØ­Ø©: used_count / valid_until (Ù…Ù migration 00001)
  const { data: row } = await supabase
    .from('discount_codes')
    .select('id, type, value, min_order_syp, max_uses, used_count, valid_until, is_active')
    .eq('code', code.toUpperCase().trim())
    .single();

  if (!row) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 404 });
  }

  type DiscountRow = {
    id: string;
    type: string;
    value: number;
    min_order_syp: number;
    max_uses: number | null;
    used_count: number;
    valid_until: string;
    is_active: boolean;
  };
  const d = row as DiscountRow;

  if (!d.is_active) {
    return NextResponse.json({ error: 'code_inactive' }, { status: 400 });
  }
  if (new Date(d.valid_until) < new Date()) {
    return NextResponse.json({ error: 'code_expired' }, { status: 400 });
  }
  if (d.max_uses !== null && d.used_count >= d.max_uses) {
    return NextResponse.json({ error: 'code_maxed' }, { status: 400 });
  }
  if (d.min_order_syp > 0 && subtotal_syp < d.min_order_syp) {
    return NextResponse.json(
      { error: 'min_order_not_met', min: d.min_order_syp },
      { status: 400 },
    );
  }

  const discount_amount =
    d.type === 'percentage'
      ? Math.round(subtotal_syp * (d.value / 100))
      : Math.min(d.value, subtotal_syp);

  return NextResponse.json({
    discount_id:     d.id,
    discount_amount,
    type:            d.type,
    value:           d.value,
  });
}
