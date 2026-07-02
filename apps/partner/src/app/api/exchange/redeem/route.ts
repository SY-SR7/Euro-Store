import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { verifyExchangeQRToken } from '@eurostore/shared';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClientFromEnv({
      get(name: string) { return cookieStore.get(name)?.value; },
      set() {},
      remove() {}
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createSupabaseAdminClientFromEnv();
    const { data: partner } = await admin
      .from('partner_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (!partner) return NextResponse.json({ error: 'Not a partner' }, { status: 403 });

    const { token } = await req.json() as { token?: string };
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    // Verify JWT signature + expiry
    let payload: { exchange_request_id: string; customer_id: string };
    try {
      payload = verifyExchangeQRToken(token, process.env.QR_SECRET ?? "");
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    // Fetch the stored token record
    const { data: tokenRecord } = await admin
      .from('exchange_qr_tokens')
      .select('id, redeemed_at, expires_at')
      .eq('token_hash', hash)
      .maybeSingle();

    if (!tokenRecord) return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    if (tokenRecord.redeemed_at) return NextResponse.json({ error: 'Token already redeemed' }, { status: 409 });
    if (new Date(tokenRecord.expires_at as string) < new Date())
      return NextResponse.json({ error: 'Token expired' }, { status: 410 });

    // Mark as redeemed + update exchange request status
    const now = new Date().toISOString();
    await Promise.all([
      admin.from('exchange_qr_tokens').update({ redeemed_at: now }).eq('id', tokenRecord.id),
      admin.from('exchange_requests').update({ status: 'completed' }).eq('id', payload.exchange_request_id),
    ]);

    await admin.from('audit_logs').insert({
      actor_id  : user.id,
      actor_role: 'partner',
      action    : 'exchange.qr.redeemed',
      entity_id  : payload.exchange_request_id,
      metadata  : { customer_id: payload.customer_id },
    });

    return NextResponse.json({ success: true, exchange_request_id: payload.exchange_request_id });
  } catch (err) {
    console.error('Redeem QR error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}




