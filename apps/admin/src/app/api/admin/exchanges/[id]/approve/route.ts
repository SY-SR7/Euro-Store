import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import QRCode from 'qrcode';
import { createInAppNotification, getPrivateStoragePath } from '@eurostore/database';
import type { Database } from '@eurostore/database';
import { requireAdminContext } from '@/supabase-server';
import { createExchangeQrToken, getExchangeQrExpiryHours, notifyExchangeCustomer } from '../../_lib';

const schema = z.object({
  resolution_path: z.enum(['helper', 'partner']),
  partner_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAdminContext('exchange_management', 'edit');
    if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    if (parsed.data.resolution_path === 'partner' && !parsed.data.partner_id) {
      return NextResponse.json({ error: 'partner_id_required' }, { status: 400 });
    }

    const { data: exchange, error: fetchError } = await ctx.admin
      .from('exchange_requests')
      .select('id, customer_id, status, qr_code_url, qr_code_expires_at, qr_code_used_at')
      .eq('id', (await params).id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!exchange) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const canRegenerate = exchange.status === 'approved'
      && !exchange.qr_code_used_at
      && Boolean(exchange.qr_code_expires_at)
      && new Date(exchange.qr_code_expires_at!) <= new Date();
    if (exchange.status !== 'pending' && !canRegenerate) {
      return NextResponse.json({ error: 'already_processed' }, { status: 400 });
    }

    const expiryHours = await getExchangeQrExpiryHours(ctx.admin);
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
    const { token, tokenHash } = createExchangeQrToken(exchange.id, exchange.customer_id, expiresAt);
    const qrPng = await QRCode.toBuffer(token, { errorCorrectionLevel: 'H', margin: 2, width: 512 });
    const qrStoragePath = `${exchange.customer_id}/${exchange.id}/${crypto.randomUUID()}.png`;
    const { error: uploadError } = await ctx.admin.storage.from('exchange-qr-codes').upload(qrStoragePath, qrPng, {
      contentType: 'image/png',
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: 'qr_storage_failed' }, { status: 500 });
    const qrObjectKey = `exchange-qr-codes/${qrStoragePath}`;
    type ApproveExchangeArgs = Database['public']['Functions']['approve_exchange_request_atomic']['Args'];
    const approveArgs = {
      p_exchange_request_id: exchange.id,
      p_resolution_path: parsed.data.resolution_path,
      p_partner_id: parsed.data.resolution_path === 'partner' ? parsed.data.partner_id ?? null : null,
      p_qr_token: token,
      p_qr_token_hash: tokenHash,
      p_qr_code_url: qrObjectKey,
      p_qr_expires_at: expiresAt,
      p_actor_id: ctx.userId,
      p_actor_role: 'admin',
    } as unknown as ApproveExchangeArgs;
    const { data: updated, error: updateError } = await ctx.admin.rpc('approve_exchange_request_atomic', approveArgs);
    if (updateError) {
      await ctx.admin.storage.from('exchange-qr-codes').remove([qrStoragePath]);
      if (updateError.message.includes('already_processed')) return NextResponse.json({ error: 'already_processed' }, { status: 409 });
      if (updateError.message.includes('partner_not_found')) return NextResponse.json({ error: 'partner_not_found' }, { status: 404 });
      throw updateError;
    }

    const previousQrPath = exchange.qr_code_url ? getPrivateStoragePath(exchange.qr_code_url, 'exchange-qr-codes') : null;
    if (previousQrPath && previousQrPath !== qrStoragePath) {
      await ctx.admin.storage.from('exchange-qr-codes').remove([previousQrPath]);
    }

    await notifyExchangeCustomer(
      ctx.admin,
      exchange.customer_id,
      exchange.id,
      'approved',
      'تم قبول طلب الاستبدال',
      'Exchange request approved',
      'رمز الاستبدال جاهز. يرجى عرضه عند الفرع أو الشريك المحدد.',
      'Your exchange QR is ready. Please present it at the selected branch or partner.',
    );
    if (parsed.data.resolution_path === 'partner' && parsed.data.partner_id) {
      await createInAppNotification(ctx.admin, {
        recipientId: parsed.data.partner_id, recipientRole: 'partner', type: 'exchange_update',
        titleAr: 'طلب استبدال مسند إليك', titleEn: 'Exchange assigned to you',
        bodyAr: 'تم إسناد طلب استبدال جديد إلى متجرك.', bodyEn: 'A new exchange request was assigned to your store.',
        referenceId: exchange.id, referenceType: 'exchange', data: { status: 'approved' },
      });
    }

    return NextResponse.json({ exchange_request: updated });
  } catch (error) {
    console.error('[POST /api/admin/exchanges/:id/approve]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
