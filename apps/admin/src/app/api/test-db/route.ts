import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('Test route called');
  try {
    const supabase = createAdminSupabaseClient();
    console.log('Client created');
    const { data, error, count } = await supabase.from('orders').select('id', { count: 'exact' }).limit(1);
    console.log('Query finished', error ? error : 'success');
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    console.error('Query error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
