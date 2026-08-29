import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';

export async function GET() {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    console.error('[GET /api/notifications/unread-count]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
