import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('shipping_rates')
    .select('id, governorate, base_rate_syp, free_shipping_threshold_syp, is_active')
    .order('governorate');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}