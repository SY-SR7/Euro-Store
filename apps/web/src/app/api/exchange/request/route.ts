/* eslint-disable */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';
import { createSupabaseAdminClientFromEnv } from '@eurostore/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { order_number?: string; reason?: string };
    if (!body.order_number?.trim() || !body.reason?.trim())
      return NextResponse.json({ error: 'Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨ ÙˆØ§Ù„Ø³Ø¨Ø¨ Ù…Ø·Ù„ÙˆØ¨Ø§Ù†' }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„' }, { status: 401 });

    const admin = createSupabaseAdminClientFromEnv();

    // Verify the order belongs to this customer
    const { data: order } = await admin
      .from('orders')
      .select('id, customer_id, status')
      .eq('order_number', body.order_number.trim())
      .eq('customer_id', user.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: 'Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ Ø£Ùˆ Ù„Ø§ ÙŠÙ†ØªÙ…ÙŠ Ù„Ø­Ø³Ø§Ø¨Ùƒ' }, { status: 404 });
    if (!['delivered', 'completed'].includes(order.status as string))
      return NextResponse.json({ error: 'Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø·Ù„Ø¨ Ø§Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„ Ø¥Ù„Ø§ Ø¨Ø¹Ø¯ Ø§Ø³ØªÙ„Ø§Ù… Ø§Ù„Ø·Ù„Ø¨' }, { status: 400 });

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
    return NextResponse.json({ error: 'Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…' }, { status: 500 });
  }
}
