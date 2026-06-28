import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv } from '@eurostore/database';
import { z } from 'zod';

const schema = z.object({ code: z.string().min(1), subtotal_syp: z.number().positive() });

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClientFromEnv(cookieStore);

  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { code, subtotal_syp } = parsed.data;

  const { data: discount } = await supabase
    .from('discount_codes')
    .select('id, type, value, min_order_syp, max_uses, uses_count, expires_at, is_active')
    .eq('code', code.toUpperCase())
    .single();

  if (!discount) return NextResponse.json({ error: 'invalid_code' }, { status: 404 });
  if (!(discount as { is_active: boolean }).is_active) return NextResponse.json({ error: 'code_inactive' }, { status: 400 });

  const d = discount as {
    id: string; type: string; value: number; min_order_syp: number | null;
    max_uses: number | null; uses_count: number; expires_at: string | null; is_active: boolean;
  };

  if (d.expires_at && new Date(d.expires_at) < new Date()) return NextResponse.json({ error: 'code_expired' }, { status: 400 });
  if (d.max_uses !== null && d.uses_count >= d.max_uses) return NextResponse.json({ error: 'code_maxed' }, { status: 400 });
  if (d.min_order_syp !== null && subtotal_syp < d.min_order_syp) {
    return NextResponse.json({ error: 'min_order_not_met', min: d.min_order_syp }, { status: 400 });
  }

  const discount_amount = d.type === 'percentage'
    ? Math.round(subtotal_syp * (d.value / 100))
    : Math.min(d.value, subtotal_syp);

  return NextResponse.json({ discount_id: d.id, discount_amount, type: d.type, value: d.value });
}