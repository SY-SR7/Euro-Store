import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export async function GET() {
  const supabase = createAdminSupabaseClient();
  
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'usd_exchange_rate')
    .maybeSingle();

  const rate = parseInt(data?.value || '15000', 10);
  return NextResponse.json({ rate });
}
