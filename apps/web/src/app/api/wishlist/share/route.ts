import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';

export async function POST() {
  try {
    const { user } = await getSessionClient();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { count, error: countError } = await admin
      .from('wishlist_items')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', user.id);

    if (countError) return NextResponse.json({ error: 'database_error' }, { status: 500 });
    if (!count) return NextResponse.json({ error: 'empty_wishlist' }, { status: 409 });

    const { data: token, error } = await admin.rpc('ensure_wishlist_share_token', {
      p_customer_id: user.id,
    });

    if (error || !token) return NextResponse.json({ error: 'share_failed' }, { status: 500 });
    return NextResponse.json({ token, path: `/wishlist/${token}` });
  } catch (error) {
    console.error('[POST /api/wishlist/share]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
