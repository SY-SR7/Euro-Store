import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createSupabaseServerClientFromEnv, createSupabaseAdminClientFromEnv } from '@eurostore/database';
import { generateExchangeQRToken } from '@eurostore/shared';

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
    const { data: helper } = await admin
      .from('helper_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (!helper) return NextResponse.json({ error: 'Not a helper' }, { status: 403 });

    const body = await req.json() as { exchange_request_id?: string };
    if (!body.exchange_request_id)
      return NextResponse.json({ error: 'exchange_request_id required' }, { status: 400 });

    const { data: exReq } = await admin
      .from('exchange_requests')
      .select('id, customer_id, status')
      .eq('id', body.exchange_request_id)
      .maybeSingle();

    if (!exReq) return NextResponse.json({ error: 'Exchange request not found' }, { status: 404 });
    if (exReq.status !== 'approved')
      return NextResponse.json({ error: 'Exchange request must be approved first' }, { status: 400 });

    const token    = generateExchangeQRToken({ exchange_request_id: exReq.id, customer_id: exReq.customer_id as string });
    const hash     = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    await admin.from('exchange_qr_tokens').upsert(
      { exchange_request_id: exReq.id, customer_id: exReq.customer_id, token_hash: hash, expires_at: expiresAt },
      { onConflict: 'exchange_request_id' },
    );

    await admin.from('audit_logs').insert({
      actor_id  : user.id,
      actor_role: 'helper',
      action    : 'exchange.qr.generated',
      entity_id  : exReq.id,
      metadata  : {},
    });

    return NextResponse.json({ token, expires_at: expiresAt });
  } catch (err) {
    console.error('Generate QR error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}




