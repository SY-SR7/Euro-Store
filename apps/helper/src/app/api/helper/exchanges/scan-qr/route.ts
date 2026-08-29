import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getHelperContext, verifyHelperExchangeToken } from '../_lib';

export async function POST(request: NextRequest) {
  try {
    const ctx = await getHelperContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null) as { qr_token?: unknown; token?: unknown } | null;
    const token = typeof body?.qr_token === 'string'
      ? body.qr_token.trim()
      : typeof body?.token === 'string'
        ? body.token.trim()
        : '';

    if (token.length < 20) return NextResponse.json({ error: 'invalid_token' }, { status: 400 });

    const result = await verifyHelperExchangeToken(ctx, token);
    if ('error' in result) {
      const statusMap: Record<string, number> = {
        token_not_found: 404,
        token_already_used: 409,
        token_expired: 410,
        token_mismatch: 400,
        exchange_not_found: 404,
        not_helper_path: 400,
        invalid_status: 409,
        inactive_helper: 403,
        invalid_scan_input: 400,
      };
      return NextResponse.json({ error: result.error }, { status: statusMap[String(result.error)] ?? 400 });
    }

    const exchange = result.exchange;
    return NextResponse.json({
      exchange_request: exchange,
      order_item: exchange.order_items,
      product: exchange.order_items?.product_snapshot ?? null,
      customer_whatsapp: exchange.customer_whatsapp,
      condition_requirements: 'Unused, original condition, all tags and labels intact',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
        return NextResponse.json({ error: error.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token' }, { status: error.name === 'TokenExpiredError' ? 410 : 400 });
      }
      if (error.message === 'exchange_qr_secret_too_short') {
        return NextResponse.json({ error: 'qr_configuration_error' }, { status: 503 });
      }
    }
    console.error('[POST /api/helper/exchanges/scan-qr]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
