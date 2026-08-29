import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getPartnerContext, transitionPartnerStage } from '../../_lib';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getPartnerContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await transitionPartnerStage(
      ctx,
      (await params).id,
      ['received_from_customer'],
      'ready_for_pickup',
      'exchange.partner.ready_for_pickup',
    );

    if ('error' in result) {
      const status = result.error === 'not_assigned_to_partner' ? 403 : result.error === 'exchange_not_found' ? 404 : 409;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ exchange: result.exchange });
  } catch (error) {
    console.error('[POST /api/partner/exchanges/:id/ready-for-pickup]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
