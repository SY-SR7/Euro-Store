import crypto from 'crypto';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createInAppNotification } from '@eurostore/database';
import { getPartnerContext, verifyScannedExchangeToken, writePartnerExchangeAudit } from '../../_lib';

const KNOWN_ERRORS = new Set([
  'token_not_found', 'token_already_used', 'token_expired', 'exchange_not_found',
  'not_partner_path', 'assigned_to_other_partner', 'invalid_status', 'invalid_stage',
  'inactive_partner', 'invalid_receipt_input',
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getPartnerContext();
    if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null) as { token?: unknown } | null;
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    if (token.length < 20) return NextResponse.json({ error: 'qr_token_required' }, { status: 400 });

    const verified = await verifyScannedExchangeToken(ctx, token);
    const verificationError = 'error' in verified ? verified.error : undefined;
    if (verificationError) {
      return NextResponse.json({ error: verificationError }, { status: errorStatus(verificationError) });
    }
    const verifiedExchange = 'exchange' in verified ? verified.exchange : undefined;
    if (!verifiedExchange) {
      return NextResponse.json({ error: 'invalid_verification_result' }, { status: 500 });
    }
    if (verifiedExchange.id !== (await params).id) {
      return NextResponse.json({ error: 'token_mismatch' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { data, error } = await ctx.admin.rpc('partner_receive_exchange_atomic', {
      p_exchange_id: (await params).id,
      p_partner_id: ctx.userId,
      p_token_hash: tokenHash,
    });
    if (error || !data) {
      const known = [...KNOWN_ERRORS].find((code) => error?.message.includes(code));
      return NextResponse.json({ error: known ?? 'receipt_failed' }, { status: known ? errorStatus(known) : 500 });
    }

    const exchange = data;
    await writePartnerExchangeAudit(
      ctx,
      (await params).id,
      'exchange.partner.confirm_receipt',
      { status: verifiedExchange.status, partner_stage: verifiedExchange.partner_stage },
      { status: exchange.status, partner_stage: exchange.partner_stage, qr_code_used_at: exchange.qr_code_used_at },
    );
    await createInAppNotification(ctx.admin, {
      recipientId: exchange.customer_id,
      recipientRole: 'customer',
      type: 'exchange_update',
      titleAr: 'تم استلام قطعة الاستبدال',
      titleEn: 'Exchange item received',
      bodyAr: 'تم استلام قطعة الاستبدال لدى الشريك.',
      bodyEn: 'Your exchange item was received by the partner.',
      referenceId: (await params).id,
      referenceType: 'exchange',
      data: { status: exchange.status, partner_stage: exchange.partner_stage },
    });

    return NextResponse.json({ exchange });
  } catch (error) {
    if (error instanceof Error) {
      if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
        return NextResponse.json({ error: error.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token' }, { status: error.name === 'TokenExpiredError' ? 410 : 400 });
      }
      if (error.message === 'exchange_qr_secret_too_short') {
        return NextResponse.json({ error: 'qr_configuration_error' }, { status: 503 });
      }
    }
    console.error('[POST /api/partner/exchanges/:id/confirm-receipt]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

function errorStatus(error: string): number {
  if (error === 'assigned_to_other_partner' || error === 'inactive_partner') return 403;
  if (error === 'exchange_not_found' || error === 'token_not_found') return 404;
  if (error === 'token_expired') return 410;
  if (['token_already_used', 'invalid_status', 'invalid_stage'].includes(error)) return 409;
  return 400;
}
