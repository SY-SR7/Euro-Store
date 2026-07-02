/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import { getSessionClient, createAdminSupabaseClient } from '@/supabase-server';
import { z } from 'zod';

const schema = z.object({
  order_id:   z.string().optional(),
  order_number: z.string().optional(),
  reason_ar:  z.string().min(2),
  reason_en:  z.string().optional().default(''),
  items:      z.array(z.object({
    variant_id: z.string().uuid(),
    quantity:   z.number().int().min(1),
  })).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });

    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'بيانات غير صحيحة', details: parsed.error.flatten() }, { status: 400 });

    if (!parsed.data.order_id && !parsed.data.order_number) {
      return NextResponse.json({ error: 'يجب تحديد رقم الطلب' }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    // Find the order by UUID or order_number
    let orderQuery = admin.from('orders').select('id,customer_id,status,order_number');
    if (parsed.data.order_id) {
      orderQuery = orderQuery.eq('id', parsed.data.order_id);
    } else {
      orderQuery = orderQuery.eq('order_number', parsed.data.order_number!);
    }
    const { data: order } = await orderQuery.maybeSingle();

    if (!order) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    if (order.customer_id !== user.id) return NextResponse.json({ error: 'هذا الطلب لا ينتمي لحسابك' }, { status: 403 });
    if (!['delivered', 'completed'].includes(order.status)) {
      return NextResponse.json({ error: 'يمكن تقديم طلب الاستبدال فقط بعد استلام الطلب' }, { status: 400 });
    }

    const { data: req, error: reqErr } = await admin
      .from('exchange_requests')
      .insert({
        order_id:    order.id,
        customer_id: user.id,
        reason_ar:   parsed.data.reason_ar,
        reason_en:   parsed.data.reason_en,
        status:      'pending',
      })
      .select('id')
      .single();

    if (reqErr) return NextResponse.json({ error: 'database_error' }, { status: 500 });

    if (parsed.data.items && parsed.data.items.length > 0) {
      await admin.from('exchange_items').insert(
        parsed.data.items.map(i => ({
          exchange_id: req.id,
          variant_id:  i.variant_id,
          quantity:    i.quantity,
        }))
      );
    }

    return NextResponse.json({ id: req.id, order_number: order.order_number }, { status: 201 });
  } catch (e) {
    console.error('exchange request error:', e);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}