import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { fetchPartnerExchange, getPartnerContext, transitionPartnerExchange } from '../../_lib';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getPartnerContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const current = await fetchPartnerExchange(ctx, (await params).id);
    if (!current) return NextResponse.json({ error: 'exchange_not_found' }, { status: 404 });
    if (current.partner_stage !== 'ready_for_pickup') {
      return NextResponse.json({ error: 'invalid_stage' }, { status: 409 });
    }

    const result = await transitionPartnerExchange(
      ctx,
      (await params).id,
      ['approved'],
      'item_received_by_shipping',
      'exchange.partner.confirm_delivery_pickup',
      { partner_stage: 'picked_up_by_delivery' },
    );

    if ('error' in result) {
      const status = result.error === 'not_assigned_to_partner' ? 403 : result.error === 'exchange_not_found' ? 404 : 409;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ exchange: result.exchange });
  } catch (error) {
    console.error('[POST /api/partner/exchanges/:id/confirm-delivery-pickup]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
