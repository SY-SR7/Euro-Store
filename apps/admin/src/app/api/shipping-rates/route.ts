import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('shipping_rates')
      .select('id,governorate,base_rate_syp,free_shipping_threshold_syp,is_active')
      .order('governorate');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: 'server_error' }, { status: 500 }); }
}