import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminContext } from '@/supabase-server';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminContext('dashboard', 'view');
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('per_page') ?? 50)));
  const from = (page - 1) * perPage;
  const unreadOnly = request.nextUrl.searchParams.get('unread') === '1';

  let query = ctx.admin
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', ctx.userId)
    .eq('recipient_role', ctx.role)
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1);
  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'database_error' }, { status: 500 });
  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, per_page: perPage });
}
