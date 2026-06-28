/* eslint-disable */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { order_number?: string; reason?: string };
    if (!body.order_number?.trim() || !body.reason?.trim())
      return NextResponse.json({ error: 'رقم الطلب والسبب مطلوبان' }, { status: 400 });

    const cookieStore = cookies();
    const supabase    = createSupabaseServerClientFromEnv(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });

    const admin = createSupabaseAdminClientFromEnv();

    // Verify the order belongs to this customer
    const { data: order } = await admin
      .from('orders')
      .select('id, customer_id, status')
      .eq('order_number', body.order_number.trim())
      .eq('customer_id', user.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: 'الطلب غير موجود أو لا ينتمي لحسابك' }, { status: 404 });
    if (!['delivered', 'completed'].includes(order.status as string))
      return NextResponse.json({ error: 'لا يمكن طلب الاستبدال إلا بعد استلام الطلب' }, { status: 400 });

    const { data: exchange, error: insertErr } = await admin
      .from('exchange_requests')
      .insert({
        order_id   : order.id,
        customer_id: user.id,
        reason     : body.reason.trim(),
        status     : 'pending',
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    // Audit log
    await admin.from('audit_logs').insert({
      actor_id  : user.id,
      actor_role: 'customer',
      action    : 'exchange.request.created',
      target_id : exchange.id,
      metadata  : { order_number: body.order_number },
    });

    return NextResponse.json({ exchange_request_id: exchange.id }, { status: 201 });
  } catch (err) {
    console.error('Exchange request error:', err);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}