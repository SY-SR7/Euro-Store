/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { getSessionClient, createAdminSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const schema = z.object({
  order_id:   z.string().uuid(),
  reason_ar:  z.string().min(5),
  reason_en:  z.string().optional().default(''),
  items:      z.array(z.object({
    variant_id: z.string().uuid(),
    quantity:   z.number().int().min(1),
  })).min(1),
});

export async function POST(request: Request) {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });

    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const admin = createAdminSupabaseClient();

    // تأكد أن الطلب يخص العميل
    const { data: order } = await admin
      .from('orders')
      .select('id, customer_id, status')
      .eq('id', parsed.data.order_id)
      .eq('customer_id', user.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: 'الطلب غير موجود أو لا ينتمي لحسابك' }, { status: 404 });
    if (!['delivered'].includes(order.status))
      return NextResponse.json({ error: 'يمكن تقديم طلب الاستبدال فقط بعد استلام الطلب' }, { status: 400 });

    const { data: req, error: reqErr } = await admin
      .from('exchange_requests')
      .insert({
        order_id:    parsed.data.order_id,
        customer_id: user.id,
        reason_ar:   parsed.data.reason_ar,
        reason_en:   parsed.data.reason_en,
        status:      'pending',
      })
      .select('id')
      .single();

    if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

    if (parsed.data.items.length > 0) {
      await admin.from('exchange_items').insert(
        parsed.data.items.map(i => ({
          exchange_id: req.id,
          variant_id:  i.variant_id,
          quantity:    i.quantity,
        }))
      );
    }

    return NextResponse.json({ exchange_id: req.id }, { status: 201 });
  } catch (e) {
    console.error('[exchange/request]', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}