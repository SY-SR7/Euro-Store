import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { client, user } = await getSessionClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get('per_page') ?? '20') || 20));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await client
    .from('loyalty_points_transactions')
    .select('id, type, points, balance_after, reference_id, notes, created_at', { count: 'exact' })
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, per_page: perPage });
}
