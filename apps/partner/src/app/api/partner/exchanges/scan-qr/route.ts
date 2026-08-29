import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getPartnerContext, verifyScannedExchangeToken, writePartnerExchangeAudit } from '../_lib';

export async function POST(request: NextRequest) {
  try {
    const ctx = await getPartnerContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null) as { token?: unknown } | null;
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    if (token.length < 20) return NextResponse.json({ error: 'invalid_token' }, { status: 400 });

    const result = await verifyScannedExchangeToken(ctx, token);
    if ('error' in result) {
      const statusMap: Record<string, number> = {
        token_not_found: 404,
        token_already_used: 409,
        token_expired: 410,
        assigned_to_other_partner: 403,
        not_partner_path: 400,
        invalid_status: 409,
      };
      return NextResponse.json({ error: result.error }, { status: statusMap[String(result.error)] ?? 400 });
    }

    await writePartnerExchangeAudit(
      ctx,
      result.exchange.id,
      'exchange.partner.scan_qr',
      { status: result.exchange.status },
      { status: result.exchange.status, partner_id: ctx.userId },
    );

    return NextResponse.json({ exchange: result.exchange });
  } catch (error) {
    if (error instanceof Error) {
      if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
        return NextResponse.json({ error: error.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token' }, { status: error.name === 'TokenExpiredError' ? 410 : 400 });
      }
      if (error.message === 'exchange_qr_secret_too_short') {
        return NextResponse.json({ error: 'qr_configuration_error' }, { status: 503 });
      }
    }
    console.error('[POST /api/partner/exchanges/scan-qr]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
