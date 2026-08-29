import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionClient } from '@/supabase-server';

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { client: supabase, user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('id', (await params).id)
      .eq('recipient_id', user.id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error('[PUT /api/notifications/:id/read]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
