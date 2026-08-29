import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

function secretsMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function POST(request: NextRequest) {
  try {
    const expected = process.env.SHAM_CASH_WEBHOOK_SECRET ?? '';
    const received = request.headers.get('x-sham-cash-signature') ?? request.headers.get('x-webhook-secret') ?? '';
    if (!expected) {
      return NextResponse.json({ error: 'webhook_not_configured' }, { status: 503 });
    }
    if (!received || !secretsMatch(expected, received)) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }

    return NextResponse.json({ error: 'payment_provider_unavailable' }, { status: 503 });
  } catch (error) {
    console.error('[POST /api/webhooks/sham-cash]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
