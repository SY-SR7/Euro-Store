import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('payment_transactions')
      .select('*, orders(customer_id)')
      .eq('id', (await params).transactionId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if ((data).orders?.customer_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    return NextResponse.json({ transaction: data });
  } catch (error) {
    console.error('[GET /api/payments/sham-cash/status/:transactionId]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
