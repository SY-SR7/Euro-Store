import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import QRCode from 'qrcode';
import { createInAppNotification, getPrivateStoragePath } from '@eurostore/database';
import type { Database } from '@eurostore/database';
import { generateExchangeQRToken } from '@eurostore/shared';
import { requireHelperContext } from '@/lib/helper-context';

const schema = z.object({ resolution_path: z.enum(['helper', 'partner']), partner_id: z.string().uuid().optional() }).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireHelperContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  if (parsed.data.resolution_path === 'partner' && !parsed.data.partner_id) return NextResponse.json({ error: 'partner_id_required' }, { status: 400 });
  if (!z.string().uuid().safeParse((await params).id).success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const { data: exchange, error: loadError } = await ctx.admin.from('exchange_requests').select('id, customer_id, status, qr_code_url, qr_code_expires_at, qr_code_used_at').eq('id', (await params).id).maybeSingle();
  if (loadError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  if (!exchange) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const canRegenerate = exchange.status === 'approved' && !exchange.qr_code_used_at && Boolean(exchange.qr_code_expires_at) && new Date(exchange.qr_code_expires_at!) <= new Date();
  if (exchange.status !== 'pending' && !canRegenerate) return NextResponse.json({ error: 'already_processed' }, { status: 409 });
  const { data: expirySetting } = await ctx.admin.from('system_settings').select('value').eq('key', 'exchange_qr_expiry_hours').maybeSingle();
  const hours = Math.max(1, Number.parseInt(expirySetting?.value ?? '72', 10) || 72);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  const secret = process.env.QR_SECRET ?? process.env.EXCHANGE_QR_SECRET ?? '';
  if (secret.length < 32) return NextResponse.json({ error: 'qr_configuration_error' }, { status: 503 });
  const token = generateExchangeQRToken({ exchangeId: exchange.id, customerId: exchange.customer_id }, secret, { expiresAt });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const qrPng = await QRCode.toBuffer(token, { errorCorrectionLevel: 'H', margin: 2, width: 512 });
  const qrStoragePath = `${exchange.customer_id}/${exchange.id}/${crypto.randomUUID()}.png`;
  const { error: uploadError } = await ctx.admin.storage.from('exchange-qr-codes').upload(qrStoragePath, qrPng, { contentType: 'image/png', upsert: false });
  if (uploadError) return NextResponse.json({ error: 'qr_storage_failed' }, { status: 500 });
  const qrObjectKey = `exchange-qr-codes/${qrStoragePath}`;
  type ApproveExchangeArgs = Database['public']['Functions']['approve_exchange_request_atomic']['Args'];
  // Supabase's generator does not represent nullable SQL function arguments.
  const rpcArgs = {
    p_exchange_request_id: exchange.id, p_resolution_path: parsed.data.resolution_path,
    p_partner_id: parsed.data.resolution_path === 'partner' ? parsed.data.partner_id ?? null : null,
    p_qr_token: token, p_qr_token_hash: tokenHash, p_qr_code_url: qrObjectKey, p_qr_expires_at: expiresAt,
    p_actor_id: ctx.user.id, p_actor_role: 'helper',
  } as unknown as ApproveExchangeArgs;
  const { data: updated, error } = await ctx.admin.rpc('approve_exchange_request_atomic', rpcArgs);
  if (error) {
    await ctx.admin.storage.from('exchange-qr-codes').remove([qrStoragePath]);
    if (error.message.includes('already_processed')) return NextResponse.json({ error: 'already_processed' }, { status: 409 });
    if (error.message.includes('partner_not_found')) return NextResponse.json({ error: 'partner_not_found' }, { status: 404 });
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }
  const previousQrPath = exchange.qr_code_url ? getPrivateStoragePath(exchange.qr_code_url, 'exchange-qr-codes') : null;
  if (previousQrPath && previousQrPath !== qrStoragePath) await ctx.admin.storage.from('exchange-qr-codes').remove([previousQrPath]);

  await createInAppNotification(ctx.admin, {
    recipientId: exchange.customer_id, recipientRole: 'customer', type: 'exchange_update',
    titleAr: 'تم قبول طلب الاستبدال', titleEn: 'Exchange request approved',
    bodyAr: 'رمز الاستبدال جاهز للاستخدام.', bodyEn: 'Your exchange QR is ready to use.',
    referenceId: exchange.id, referenceType: 'exchange', data: { status: 'approved' },
  });
  if (parsed.data.resolution_path === 'partner' && parsed.data.partner_id) {
    await createInAppNotification(ctx.admin, {
      recipientId: parsed.data.partner_id, recipientRole: 'partner', type: 'exchange_update',
      titleAr: 'طلب استبدال مسند إليك', titleEn: 'Exchange assigned to you',
      bodyAr: 'تم إسناد طلب استبدال جديد إلى متجرك.', bodyEn: 'A new exchange request was assigned to your store.',
      referenceId: exchange.id, referenceType: 'exchange', data: { status: 'approved' },
    });
  }
  return NextResponse.json({ exchange_request: updated });
}
