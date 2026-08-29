import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';

export async function GET() {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0, page: 1, per_page: data?.length ?? 0 });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
