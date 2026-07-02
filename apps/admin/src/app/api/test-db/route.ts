import { NextResponse } from 'next/server';
import { createAdminSupabaseClient, requireAdminContext } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireAdminContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const supabase = createAdminSupabaseClient();
    const { error, count } = await supabase.from('orders').select('id', { count: 'exact', head: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'server_error' }, { status: 500 });
  }
}