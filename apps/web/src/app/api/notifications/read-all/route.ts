import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';

export async function PUT() {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/notifications/read-all]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
